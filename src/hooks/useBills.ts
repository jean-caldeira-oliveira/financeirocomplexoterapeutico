import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Bill,
  BillEditScope,
  BillHistory,
  BillPayment,
  BillPaymentMethod,
  BillRecurrence,
  BillStatus,
} from "@/types/bill";
import { writeAuditLog } from "@/utils/auditLog";
import {
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  isBefore,
  startOfDay,
} from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export interface AddBillData {
  description: string;
  amount: number;
  dueDate: Date;
  category: string;
  subcategory: string;
  recurrence?: BillRecurrence;
  installments?: number;
  notes?: string;
}

export interface NewPaymentLine {
  amount: string;
  paymentMethod: BillPaymentMethod;
  paymentDate: string;
  notes: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mapPaymentRow = (row: any): BillPayment => ({
  id: row.id,
  billId: row.bill_id,
  userId: row.user_id,
  amount: Number(row.amount),
  paymentDate: row.payment_date,
  paymentMethod: row.payment_method as BillPaymentMethod,
  notes: row.notes ?? undefined,
  createdAt: row.created_at,
});

/**
 * Compute the derived status of a bill based on its payments and due date.
 * This is the single source of truth for status calculation.
 */
const computeStatus = (
  billAmount: number,
  dueDate: string,
  payments: BillPayment[],
  currentStatus: BillStatus
): BillStatus => {
  // Never downgrade a manually-set paid status if payments table is empty
  // (legacy bills paid before this migration)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid >= billAmount) return "paid";
  if (totalPaid > 0) return "partially_paid";

  // No payments recorded — check due date
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  if (isBefore(due, today)) {
    // Bills due before the system went live (May 2026) are shown as pre-system
    const systemStart = new Date(2026, 4, 1); // May 1, 2026
    if (isBefore(due, systemStart)) return "pre_system";
    return "overdue";
  }
  return "pending";
};

const mapRow = (row: any, payments: BillPayment[] = []): Bill => {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const rawStatus = row.status as BillStatus;

  // If no payments in new table, respect legacy status (paid bills migrated)
  const status =
    payments.length > 0
      ? computeStatus(Number(row.amount), row.due_date, payments, rawStatus)
      : rawStatus;

  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    dueDate: row.due_date,
    category: row.category,
    subcategory: row.subcategory,
    status,
    recurrence: row.recurrence as BillRecurrence,
    recurrenceGroupId: row.recurrence_group_id ?? undefined,
    installmentNumber: row.installment_number ?? undefined,
    totalInstallments: row.total_installments ?? undefined,
    paidAt: row.paid_at ?? undefined,
    paymentDate: row.payment_date ?? undefined,
    paidAmount: row.paid_amount != null ? Number(row.paid_amount) : undefined,
    paymentMethod: row.payment_method as BillPaymentMethod | undefined,
    notes: row.notes ?? undefined,
    paymentNotes: row.payment_notes ?? undefined,
    createdAt: row.created_at,
    payments,
    totalPaid,
  };
};

// ─── Audit log helper ────────────────────────────────────────────────────────
async function insertHistory(
  billId: string,
  userId: string,
  userName: string,
  action: BillHistory["action"],
  description: string
) {
  await supabase.from("bill_history").insert({
    bill_id: billId,
    user_id: userId,
    user_name: userName,
    action,
    description,
  });
}

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // ─── fetchBills: load bills + their payments, compute status ───────────────
  const fetchBills = useCallback(async () => {
    if (!user) {
      setBills([]);
      setIsLoading(false);
      return;
    }

    // Fetch bills and all their payments in parallel
    const [billsRes, paymentsRes] = await Promise.all([
      supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("bill_payments")
        .select("*")
        .order("payment_date", { ascending: true }),
    ]);

    if (billsRes.error) {
      console.error("Error fetching bills:", billsRes.error);
      toast.error("Erro ao carregar contas");
      setIsLoading(false);
      return;
    }

    // Group payments by bill_id
    const paymentsByBill: Record<string, BillPayment[]> = {};
    for (const p of paymentsRes.data || []) {
      const mapped = mapPaymentRow(p);
      if (!paymentsByBill[mapped.billId]) paymentsByBill[mapped.billId] = [];
      paymentsByBill[mapped.billId].push(mapped);
    }

    setBills(
      (billsRes.data || []).map((row) =>
        mapRow(row, paymentsByBill[row.id] ?? [])
      )
    );
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const getNextDueDate = (
    currentDueDate: Date,
    recurrence: BillRecurrence
  ): Date => {
    switch (recurrence) {
      case "weekly":
        return addWeeks(currentDueDate, 1);
      case "biweekly":
        return addWeeks(currentDueDate, 2);
      case "monthly":
        return addMonths(currentDueDate, 1);
      case "yearly":
        return addYears(currentDueDate, 1);
      default:
        return currentDueDate;
    }
  };

  const getRecurrenceCount = (recurrence: BillRecurrence): number => {
    switch (recurrence) {
      case "weekly":
        return 52;
      case "biweekly":
        return 26;
      case "monthly":
        return 12;
      case "yearly":
        return 3;
      default:
        return 1;
    }
  };

  const addBill = useCallback(
    async (data: AddBillData) => {
      const today = startOfDay(new Date());
      const rows: any[] = [];
      const installments = data.installments || 1;
      const recurrence = data.recurrence || "none";
      // Generate one group ID for the entire series (installments or recurrence)
      const seriesGroupId = crypto.randomUUID();

      if (installments > 1) {
        for (let i = 0; i < installments; i++) {
          const dueDate = addMonths(startOfDay(data.dueDate), i);
          const status: BillStatus = isBefore(dueDate, today)
            ? "overdue"
            : "pending";
          rows.push({
            user_id: user!.id,
            description: data.description,
            amount: data.amount,
            due_date: dueDate.toISOString(),
            category: data.category,
            subcategory: data.subcategory,
            status,
            recurrence: "none",
            installment_number: i + 1,
            total_installments: installments,
            notes: data.notes ?? null,
            recurrence_group_id: seriesGroupId,
          });
        }
      } else if (recurrence !== "none") {
        const count = getRecurrenceCount(recurrence);
        let currentDueDate = startOfDay(data.dueDate);
        for (let i = 0; i < count; i++) {
          const status: BillStatus = isBefore(currentDueDate, today)
            ? "overdue"
            : "pending";
          rows.push({
            user_id: user!.id,
            description: data.description,
            amount: data.amount,
            due_date: currentDueDate.toISOString(),
            category: data.category,
            subcategory: data.subcategory,
            status,
            recurrence,
            notes: data.notes ?? null,
            recurrence_group_id: seriesGroupId,
          });
          currentDueDate = getNextDueDate(currentDueDate, recurrence);
        }
      } else {
        const dueDate = startOfDay(data.dueDate);
        const status: BillStatus = isBefore(dueDate, today)
          ? "overdue"
          : "pending";
        rows.push({
          user_id: user!.id,
          description: data.description,
          amount: data.amount,
          due_date: dueDate.toISOString(),
          category: data.category,
          subcategory: data.subcategory,
          status,
          recurrence: "none",
          notes: data.notes ?? null,
          // single bills have no group
        });
      }

      const { data: inserted, error } = await supabase
        .from("bills")
        .insert(rows)
        .select();

      if (error) {
        console.error("Error adding bills:", error);
        toast.error("Erro ao adicionar conta");
        return [];
      }

      const newBills = (inserted || []).map((row: any) => mapRow(row, []));
      setBills((prev) => [...newBills, ...prev]);

      // Audit log for each created bill
      for (const b of newBills) {
        await insertHistory(
          b.id,
          user!.id,
          user!.email ?? "Usuário",
          "create",
          `Conta criada: "${b.description}" — vencimento ${new Date(
            b.dueDate
          ).toLocaleDateString("pt-BR")}`
        );
      }

      // Write to global audit_log
      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "contas",
        action: "criar",
        description: `${newBills.length} conta(s) criada(s): "${data.description}"`,
        entityName: data.description,
        entityId: newBills[0]?.id,
      });

      toast.success(
        newBills.length > 1
          ? `${newBills.length} contas criadas`
          : "Conta criada"
      );
      return newBills;
    },
    [user]
  );

  // ─── addBillPayment: multi-line partial/full payment ──────────────────────
  const addBillPayment = useCallback(
    async (
      billId: string,
      lines: {
        amount: number;
        paymentMethod: BillPaymentMethod;
        paymentDate: Date;
        notes?: string;
      }[]
    ) => {
      const bill = bills.find((b) => b.id === billId);
      if (!bill || !user) return;

      const rows = lines.map((l) => ({
        bill_id: billId,
        user_id: user.id,
        amount: l.amount,
        payment_date: l.paymentDate.toISOString(),
        payment_method: l.paymentMethod,
        notes: l.notes ?? null,
      }));

      const { data: inserted, error } = await supabase
        .from("bill_payments")
        .insert(rows)
        .select();

      if (error) {
        console.error("Error adding bill payments:", error);
        toast.error("Erro ao registrar pagamento");
        return;
      }

      const newPayments = (inserted || []).map(mapPaymentRow);
      const allPayments = [...(bill.payments ?? []), ...newPayments];
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const newStatus = computeStatus(
        bill.amount,
        bill.dueDate,
        allPayments,
        bill.status
      );

      // Update bill status in DB
      await supabase
        .from("bills")
        .update({ status: newStatus })
        .eq("id", billId);

      // Update local state
      setBills((prev) =>
        prev.map((b) =>
          b.id !== billId
            ? b
            : { ...b, payments: allPayments, totalPaid, status: newStatus }
        )
      );

      // Audit log
      const totalAmount = lines.reduce((s, l) => s + l.amount, 0);
      const action: BillHistory["action"] =
        newStatus === "paid" ? "full_payment" : "partial_payment";
      const methodLabel =
        lines.length === 1
          ? lines[0].paymentMethod.toUpperCase()
          : "múltiplas formas";
      await insertHistory(
        billId,
        user.id,
        user.email ?? "Usuário",
        action,
        `Pagamento de R$${totalAmount.toFixed(
          2
        )} via ${methodLabel} — status: ${newStatus}`
      );

      await writeAuditLog({
        userId: user.id,
        userName: user.user_metadata?.full_name ?? user.email ?? "Usuário",
        userEmail: user.email ?? undefined,
        module: "contas",
        action: newStatus === "paid" ? "pagar" : "pagamento_parcial",
        description: `Pagamento de R$${totalAmount.toFixed(
          2
        )} via ${methodLabel} na conta "${bill.description}"`,
        entityName: bill.description,
        entityId: billId,
      });

      toast.success(
        newStatus === "paid" ? "Conta quitada!" : "Pagamento parcial registrado"
      );
    },
    [bills, user]
  );

  // ─── revertPayment: delete a specific payment and recompute status ─────────
  const revertPayment = useCallback(
    async (paymentId: string, billId: string) => {
      const bill = bills.find((b) => b.id === billId);
      if (!bill || !user) return;

      const { error } = await supabase
        .from("bill_payments")
        .delete()
        .eq("id", paymentId);

      if (error) {
        console.error("Error reverting payment:", error);
        toast.error("Erro ao estornar pagamento");
        return;
      }

      const remainingPayments = (bill.payments ?? []).filter(
        (p) => p.id !== paymentId
      );
      const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
      const newStatus = computeStatus(
        bill.amount,
        bill.dueDate,
        remainingPayments,
        bill.status
      );

      await supabase
        .from("bills")
        .update({ status: newStatus })
        .eq("id", billId);

      setBills((prev) =>
        prev.map((b) =>
          b.id !== billId
            ? b
            : {
                ...b,
                payments: remainingPayments,
                totalPaid,
                status: newStatus,
              }
        )
      );

      await insertHistory(
        billId,
        user.id,
        user.email ?? "Usuário",
        "revert_payment",
        `Pagamento estornado — novo status: ${newStatus}`
      );

      await writeAuditLog({
        userId: user.id,
        userName: user.user_metadata?.full_name ?? user.email ?? "Usuário",
        userEmail: user.email ?? undefined,
        module: "contas",
        action: "reverter_pagamento",
        description: `Pagamento estornado na conta "${bill.description}" — novo status: ${newStatus}`,
        entityName: bill.description,
        entityId: billId,
      });

      toast.success("Pagamento estornado");
    },
    [bills, user]
  );

  // ─── markAsPending: legacy revert (clears all payments) ───────────────────
  const markAsPending = useCallback(
    async (id: string) => {
      const today = startOfDay(new Date());
      const bill = bills.find((b) => b.id === id);
      if (!bill || !user) return;

      // Delete all payments for this bill
      await supabase.from("bill_payments").delete().eq("bill_id", id);

      const dueDate = startOfDay(new Date(bill.dueDate));
      const systemStart = new Date(2026, 4, 1);
      const newStatus: BillStatus = isBefore(dueDate, today)
        ? isBefore(dueDate, systemStart) ? "pre_system" : "overdue"
        : "pending";

      const { error } = await supabase
        .from("bills")
        .update({
          status: newStatus,
          paid_at: null,
          payment_date: null,
          paid_amount: null,
          payment_method: null,
        })
        .eq("id", id);

      if (error) {
        console.error("Error marking bill as pending:", error);
        toast.error("Erro ao desfazer pagamento");
        return;
      }

      setBills((prev) =>
        prev.map((b) =>
          b.id !== id
            ? b
            : {
                ...b,
                status: newStatus,
                paidAt: undefined,
                paymentDate: undefined,
                paidAmount: undefined,
                paymentMethod: undefined,
                payments: [],
                totalPaid: 0,
              }
        )
      );

      await insertHistory(
        id,
        user.id,
        user.email ?? "Usuário",
        "revert_payment",
        `Todos os pagamentos removidos — status revertido para ${newStatus}`
      );

      await writeAuditLog({
        userId: user.id,
        userName: user.user_metadata?.full_name ?? user.email ?? "Usuário",
        userEmail: user.email ?? undefined,
        module: "contas",
        action: "reverter_pagamento",
        description: `Todos os pagamentos removidos da conta "${
          bill?.description ?? id
        }" — status: ${newStatus}`,
        entityName: bill?.description ?? undefined,
        entityId: id,
      });

      toast.success("Pagamento desfeito");
    },
    [bills, user]
  );

  const deleteBill = useCallback(
    async (id: string) => {
      const bill = bills.find((b) => b.id === id);
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) {
        console.error("Error deleting bill:", error);
        toast.error("Erro ao excluir conta");
        return;
      }
      setBills((prev) => prev.filter((b) => b.id !== id));

      if (bill && user) {
        await insertHistory(
          id,
          user.id,
          user.email ?? "Usuário",
          "delete",
          `Conta excluída: "${bill.description}"`
        );
        await writeAuditLog({
          userId: user.id,
          userName: user.user_metadata?.full_name ?? user.email ?? "Usuário",
          userEmail: user.email ?? undefined,
          module: "contas",
          action: "excluir",
          description: `Conta excluída: "${bill.description}"`,
          entityName: bill.description,
          entityId: id,
        });
      }
      toast.success("Conta excluída");
    },
    [bills, user]
  );

  const deleteBillAndFuture = useCallback(
    async (id: string) => {
      const billToDelete = bills.find((b) => b.id === id);
      if (!billToDelete) return;

      // Fallback: if no group ID, just delete the single bill
      if (!billToDelete.recurrenceGroupId) {
        await deleteBill(id);
        return;
      }

      const billDueDate = startOfDay(
        new Date(billToDelete.dueDate)
      ).toISOString();

      const { error } = await supabase
        .from("bills")
        .delete()
        .eq("recurrence_group_id", billToDelete.recurrenceGroupId)
        .gte("due_date", billDueDate);

      if (error) {
        console.error("Error deleting bills:", error);
        toast.error("Erro ao excluir contas");
        return;
      }

      const cutoff = startOfDay(new Date(billToDelete.dueDate));
      setBills((prev) =>
        prev.filter((b) => {
          if (b.recurrenceGroupId !== billToDelete.recurrenceGroupId)
            return true;
          return isBefore(startOfDay(new Date(b.dueDate)), cutoff);
        })
      );
      toast.success("Esta conta e as futuras foram excluídas");
    },
    [bills, deleteBill]
  );

  const deleteAllRecurrences = useCallback(
    async (id: string) => {
      const billToDelete = bills.find((b) => b.id === id);
      if (!billToDelete) return;

      // Fallback: if no group ID, just delete the single bill
      if (!billToDelete.recurrenceGroupId) {
        await deleteBill(id);
        return;
      }

      const { error } = await supabase
        .from("bills")
        .delete()
        .eq("recurrence_group_id", billToDelete.recurrenceGroupId);

      if (error) {
        console.error("Error deleting all recurrences:", error);
        toast.error("Erro ao excluir série de contas");
        return;
      }

      setBills((prev) =>
        prev.filter(
          (b) => b.recurrenceGroupId !== billToDelete.recurrenceGroupId
        )
      );
      toast.success("Toda a série foi excluída");
    },
    [bills, deleteBill]
  );

  const updateBill = useCallback(
    async (
      id: string,
      data: Partial<AddBillData>,
      scope: BillEditScope = "only_this"
    ) => {
      const today = startOfDay(new Date());
      const bill = bills.find((b) => b.id === id);
      if (!bill || !user) return;

      // dueDate changes only apply to the single bill being edited.
      // Propagating a fixed date to future bills collapses them all to the same month.
      const applyDueDate = scope === "only_this";

      const buildUpdates = (b: Bill) => {
        const updates: any = {};
        if (data.description !== undefined)
          updates.description = data.description;
        if (data.amount !== undefined) updates.amount = data.amount;
        if (data.category !== undefined) updates.category = data.category;
        if (data.subcategory !== undefined)
          updates.subcategory = data.subcategory;
        if (data.recurrence !== undefined) updates.recurrence = data.recurrence;
        if (data.notes !== undefined) updates.notes = data.notes;
        if (applyDueDate && data.dueDate !== undefined) {
          updates.due_date = data.dueDate.toISOString();
          if (b.status !== "paid" && b.status !== "partially_paid") {
            updates.status = isBefore(startOfDay(data.dueDate), today)
              ? "overdue"
              : "pending";
          }
        }
        return updates;
      };

      let query = supabase.from("bills").update(buildUpdates(bill));

      if (scope === "only_this" || !bill.recurrenceGroupId) {
        query = query.eq("id", id);
      } else if (scope === "this_and_future") {
        query = query
          .eq("recurrence_group_id", bill.recurrenceGroupId)
          .gte("due_date", startOfDay(new Date(bill.dueDate)).toISOString());
      } else {
        // all_series
        query = query.eq("recurrence_group_id", bill.recurrenceGroupId);
      }

      const { error } = await query;
      if (error) {
        console.error("Error updating bill:", error);
        toast.error("Erro ao atualizar conta");
        return;
      }

      // Update local state
      setBills((prev) =>
        prev.map((b) => {
          const shouldUpdate =
            scope === "only_this"
              ? b.id === id
              : scope === "this_and_future"
              ? b.recurrenceGroupId === bill.recurrenceGroupId &&
                !isBefore(
                  startOfDay(new Date(b.dueDate)),
                  startOfDay(new Date(bill.dueDate))
                )
              : b.recurrenceGroupId === bill.recurrenceGroupId;

          if (!shouldUpdate) return b;

          const updates = buildUpdates(b);
          return {
            ...b,
            description: updates.description ?? b.description,
            amount: updates.amount ?? b.amount,
            category: updates.category ?? b.category,
            subcategory: updates.subcategory ?? b.subcategory,
            recurrence: updates.recurrence ?? b.recurrence,
            notes: updates.notes ?? b.notes,
            dueDate: updates.due_date ?? b.dueDate,
            status: updates.status ?? b.status,
          };
        })
      );

      const scopeLabel =
        scope === "only_this"
          ? "apenas esta ocorrência"
          : scope === "this_and_future"
          ? "esta e futuras ocorrências"
          : "toda a série";

      await insertHistory(
        id,
        user.id,
        user.email ?? "Usuário",
        "edit",
        `Conta editada (${scopeLabel}): "${bill.description}"`
      );

      await writeAuditLog({
        userId: user.id,
        userName: user.user_metadata?.full_name ?? user.email ?? "Usuário",
        userEmail: user.email ?? undefined,
        module: "contas",
        action: "editar",
        description: `Conta editada (${scopeLabel}): "${bill.description}"`,
        entityName: bill.description,
        entityId: id,
      });

      toast.success("Conta atualizada");
    },
    [bills, user]
  );

  const stats = useMemo(() => {
    const pending = bills.filter((b) => b.status === "pending");
    const overdue = bills.filter((b) => b.status === "overdue");
    const partiallyPaid = bills.filter((b) => b.status === "partially_paid");
    const paid = bills.filter((b) => b.status === "paid");
    return {
      pendingCount: pending.length,
      pendingTotal: pending.reduce((sum, b) => sum + b.amount, 0),
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((sum, b) => sum + b.amount, 0),
      partiallyPaidCount: partiallyPaid.length,
      partiallyPaidTotal: partiallyPaid.reduce((sum, b) => sum + b.amount, 0),
      paidCount: paid.length,
      paidTotal: paid.reduce(
        (sum, b) => sum + (b.totalPaid ?? b.paidAmount ?? b.amount),
        0
      ),
    };
  }, [bills]);

  const upcomingBills = useMemo(() => {
    const today = startOfDay(new Date());
    return bills
      .filter((bill) => {
        if (bill.status === "paid") return false;
        const dueDate = startOfDay(new Date(bill.dueDate));
        const daysUntilDue = differenceInDays(dueDate, today);
        return daysUntilDue >= 0 && daysUntilDue <= 7;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [bills]);

  const overdueBills = useMemo(() => {
    return bills
      .filter((bill) => bill.status === "overdue")
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [bills]);

  // ─── fetchBillHistory: load audit log for a specific bill ─────────────────
  const fetchBillHistory = useCallback(
    async (billId: string): Promise<BillHistory[]> => {
      const { data, error } = await supabase
        .from("bill_history")
        .select("*")
        .eq("bill_id", billId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching bill history:", error);
        return [];
      }

      return (data || []).map(
        (row: any): BillHistory => ({
          id: row.id,
          billId: row.bill_id,
          userId: row.user_id ?? undefined,
          userName: row.user_name ?? undefined,
          action: row.action as BillHistory["action"],
          description: row.description ?? undefined,
          createdAt: row.created_at,
        })
      );
    },
    []
  );

  const getBillsByMonth = useCallback(
    (year: number, month: number) => {
      return bills.filter((bill) => {
        const dueDate = new Date(bill.dueDate);
        return dueDate.getFullYear() === year && dueDate.getMonth() === month;
      });
    },
    [bills]
  );

  // Get actual expense (paid bills, by payment date) within [from, to]
  const getBillsActualExpenseByDateRange = useCallback(
    (from: Date, to: Date): number => {
      let total = 0;
      for (const b of bills) {
        // New system: sum individual payment records that fall in range
        if (b.payments && b.payments.length > 0) {
          for (const p of b.payments) {
            const pDate = new Date(p.paymentDate);
            if (pDate >= from && pDate <= to) {
              total += p.amount;
            }
          }
        } else {
          // Legacy: single payment date on the bill itself
          if (b.status !== "paid") continue;
          const payDate = b.paymentDate
            ? new Date(b.paymentDate)
            : b.paidAt
            ? new Date(b.paidAt)
            : null;
          if (!payDate) continue;
          if (payDate >= from && payDate <= to) {
            total += b.paidAmount ?? b.amount;
          }
        }
      }
      return total;
    },
    [bills]
  );

  // Get expected expense (all bills by due date) within [from, to]
  const getBillsExpectedExpenseByDateRange = useCallback(
    (from: Date, to: Date): number => {
      return bills
        .filter((b) => {
          const dueDate = new Date(b.dueDate);
          return dueDate >= from && dueDate <= to;
        })
        .reduce((sum, b) => sum + b.amount, 0);
    },
    [bills]
  );

  return {
    bills,
    isLoading,
    stats,
    upcomingBills,
    overdueBills,
    addBill,
    addBillPayment,
    revertPayment,
    markAsPending,
    deleteBill,
    deleteBillAndFuture,
    deleteAllRecurrences,
    updateBill,
    fetchBillHistory,
    getBillsByMonth,
    getBillsActualExpenseByDateRange,
    getBillsExpectedExpenseByDateRange,
  };
}
