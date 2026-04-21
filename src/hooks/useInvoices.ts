import { useState, useEffect, useMemo, useCallback } from 'react';
import { Invoice, InvoicePayment, InvoicePaymentMethod, InvoiceStatus, InvoiceType } from '@/types/invoice';
import { addMonths, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const DEFAULT_INTEREST_RATE_MONTHLY = 2;

export interface GenerateInvoicesData {
  patientId: string;
  patientName: string;
  monthlyFee: number;
  dueDay: number;
  installments: number;
  startDate: Date;
  firstInstallmentDate?: Date;
  hasEnrollmentFee?: boolean;
  enrollmentFee?: number;
  enrollmentDueDate?: Date;
  interestRateMonthly?: number;
}

export interface AddInvoicePaymentData {
  amount: number;
  paymentDate: Date;
  method: InvoicePaymentMethod;
  isLate?: boolean;
  note?: string;
}

const mapPaymentRow = (row: any): InvoicePayment => ({
  id: row.id,
  amount: Number(row.amount),
  paymentDate: row.payment_date,
  method: row.method as InvoicePaymentMethod,
  isLate: row.is_late ?? undefined,
  note: row.note ?? undefined,
  createdAt: row.created_at,
});

const mapRow = (row: any, payments: InvoicePayment[] = []): Invoice => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.patient_name,
  amount: Number(row.amount),
  dueDate: row.due_date,
  installmentNumber: row.installment_number,
  totalInstallments: row.total_installments,
  status: row.status as InvoiceStatus,
  type: row.type as InvoiceType,
  description: row.description ?? undefined,
  paidAt: row.paid_at ?? undefined,
  payments,
  interestRateMonthly: row.interest_rate_monthly != null ? Number(row.interest_rate_monthly) : undefined,
  fineRate: Number(row.fine_rate ?? 0),
  gracePeriodDays: Number(row.grace_period_days ?? 0),
  billingMethod: (row.billing_method ?? '') as any,
  createdAt: row.created_at,
});

const getInvoicePaidAmount = (invoice: Invoice) => {
  const payments = invoice.payments ?? [];
  if (payments.length > 0) return payments.reduce((sum, p) => sum + p.amount, 0);
  if (invoice.status === 'paid') return invoice.amount;
  return 0;
};

const getInvoiceRemainingAmount = (invoice: Invoice) => {
  const remaining = invoice.amount - getInvoicePaidAmount(invoice);
  return remaining > 0 ? remaining : 0;
};

const getInvoiceInterest = (invoice: Invoice) => {
  if (invoice.status === 'paid') return 0;
  const rate = invoice.interestRateMonthly ?? DEFAULT_INTEREST_RATE_MONTHLY;
  const fineRate = invoice.fineRate ?? 0;
  const graceDays = invoice.gracePeriodDays ?? 0;
  const today = startOfDay(new Date());
  const dueDate = startOfDay(new Date(invoice.dueDate));
  const daysLate = differenceInDays(today, dueDate);
  if (daysLate <= 0) return 0;
  // Grace period: no interest/fine during grace
  const effectiveDaysLate = Math.max(0, daysLate - graceDays);
  if (effectiveDaysLate <= 0) return 0;
  const remaining = getInvoiceRemainingAmount(invoice);
  // Fine (multa): one-time percentage on remaining
  const fineAmount = fineRate > 0 ? remaining * (fineRate / 100) : 0;
  // Interest: pro-rata daily
  const dailyRate = rate / 100 / 30;
  const interestAmount = rate > 0 ? remaining * dailyRate * effectiveDaysLate : 0;
  return Math.round((fineAmount + interestAmount) * 100) / 100;
};

const getInvoiceTotalDue = (invoice: Invoice) => {
  return getInvoiceRemainingAmount(invoice) + getInvoiceInterest(invoice);
};

const getStatusByDueDate = (dueDateIso: string): InvoiceStatus => {
  const today = startOfDay(new Date());
  const dueDate = startOfDay(new Date(dueDateIso));
  return isBefore(dueDate, today) ? 'overdue' : 'pending';
};

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvoices = useCallback(async () => {
    if (!user) { setInvoices([]); setIsLoading(false); return; }

    const [invResult, payResult] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('invoice_payments').select('*').order('created_at', { ascending: true }),
    ]);

    if (invResult.error) {
      console.error('Error fetching invoices:', invResult.error);
      toast.error('Erro ao carregar cobranças');
      setIsLoading(false);
      return;
    }

    const paymentsByInvoice: Record<string, InvoicePayment[]> = {};
    (payResult.data || []).forEach((row) => {
      const invId = row.invoice_id;
      if (!paymentsByInvoice[invId]) paymentsByInvoice[invId] = [];
      paymentsByInvoice[invId].push(mapPaymentRow(row));
    });

    setInvoices((invResult.data || []).map((row) => mapRow(row, paymentsByInvoice[row.id] || [])));
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Auto-update overdue status
  useEffect(() => {
    if (invoices.length === 0) return;
    const updates: { id: string; status: InvoiceStatus }[] = [];

    const updated = invoices.map((inv) => {
      const remaining = getInvoiceRemainingAmount(inv);
      if (remaining <= 0) {
        if (inv.status !== 'paid') {
          updates.push({ id: inv.id, status: 'paid' });
          return { ...inv, status: 'paid' as InvoiceStatus };
        }
        return inv;
      }
      const nextStatus = getStatusByDueDate(inv.dueDate);
      if (inv.status !== nextStatus) {
        updates.push({ id: inv.id, status: nextStatus });
        return { ...inv, status: nextStatus };
      }
      return inv;
    });

    if (updates.length > 0) {
      setInvoices(updated);
      updates.forEach(({ id, status }) => {
        supabase.from('invoices').update({ status }).eq('id', id).then();
      });
    }
  }, [invoices.length]);

  const generateInvoicesForPatient = useCallback(async (data: GenerateInvoicesData) => {
    const today = startOfDay(new Date());
    const rows: any[] = [];

    const totalInstallments = data.hasEnrollmentFee && data.enrollmentFee
      ? data.installments + 1
      : data.installments;

    if (data.hasEnrollmentFee && data.enrollmentFee && data.enrollmentFee > 0) {
      const enrollDueDate = data.enrollmentDueDate ? startOfDay(data.enrollmentDueDate) : startOfDay(data.startDate);
      rows.push({
        user_id: user!.id,
        patient_id: data.patientId,
        patient_name: data.patientName,
        amount: data.enrollmentFee,
        due_date: enrollDueDate.toISOString(),
        installment_number: 1,
        total_installments: totalInstallments,
        status: isBefore(enrollDueDate, today) ? 'overdue' : 'pending',
        type: 'enrollment',
        interest_rate_monthly: data.interestRateMonthly,
      });
    }

    const startingInstallment = data.hasEnrollmentFee && data.enrollmentFee ? 2 : 1;
    const monthlyBaseDate = data.firstInstallmentDate ?? data.startDate;

    for (let i = 0; i < data.installments; i++) {
      const baseDate = addMonths(monthlyBaseDate, i);
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const actualDueDay = Math.min(data.dueDay, lastDayOfMonth);
      const dueDate = new Date(year, month, actualDueDay);

      rows.push({
        user_id: user!.id,
        patient_id: data.patientId,
        patient_name: data.patientName,
        amount: data.monthlyFee,
        due_date: dueDate.toISOString(),
        installment_number: startingInstallment + i,
        total_installments: totalInstallments,
        status: isBefore(dueDate, today) ? 'overdue' : 'pending',
        type: 'monthly',
        interest_rate_monthly: data.interestRateMonthly,
      });
    }

    const { data: inserted, error } = await supabase
      .from('invoices')
      .insert(rows)
      .select();

    if (error) {
      console.error('Error generating invoices:', error);
      toast.error('Erro ao gerar cobranças');
      return [];
    }

    const newInvoices = (inserted || []).map((row) => mapRow(row, []));
    setInvoices((prev) => [...newInvoices, ...prev]);
    return newInvoices;
  }, [user]);

  const addPayment = useCallback(async (id: string, payment: AddInvoicePaymentData) => {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) return;

    const remainingBefore = getInvoiceRemainingAmount(invoice);
    // Allow full payment amount (including interest/fines) — don't cap at original remaining
    const appliedAmount = payment.amount;
    if (appliedAmount <= 0) return;

    const { data: insertedPayment, error } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: id,
        user_id: user!.id,
        amount: appliedAmount,
        payment_date: payment.paymentDate.toISOString(),
        method: payment.method,
        is_late: payment.isLate ?? false,
        note: payment.note ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding payment:', error);
      toast.error('Erro ao registrar pagamento');
      return;
    }

    const newPayment = mapPaymentRow(insertedPayment);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const nextPayments = [...(inv.payments ?? []), newPayment];
        const paidAmount = nextPayments.reduce((sum, p) => sum + p.amount, 0);
        const isFullyPaid = paidAmount >= inv.amount;
        const updatedInv = {
          ...inv,
          payments: nextPayments,
          status: isFullyPaid ? ('paid' as InvoiceStatus) : getStatusByDueDate(inv.dueDate),
          paidAt: isFullyPaid ? payment.paymentDate.toISOString() : undefined,
        };

        // Update invoice status in DB
        supabase.from('invoices').update({
          status: updatedInv.status,
          paid_at: updatedInv.paidAt ?? null,
        }).eq('id', id).then();

        return updatedInv;
      })
    );
  }, [invoices, user]);

  const markAsPaid = useCallback(async (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) return;

    const remaining = getInvoiceRemainingAmount(invoice);
    if (remaining <= 0) {
      await supabase.from('invoices').update({ status: 'paid', paid_at: invoice.paidAt ?? new Date().toISOString() }).eq('id', id);
      setInvoices((prev) =>
        prev.map((inv) => inv.id === id ? { ...inv, status: 'paid' as InvoiceStatus, paidAt: inv.paidAt ?? new Date().toISOString() } : inv)
      );
      return;
    }

    // Add a cash payment for the remaining amount
    const { data: insertedPayment, error } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: id,
        user_id: user!.id,
        amount: remaining,
        payment_date: new Date().toISOString(),
        method: 'cash',
      })
      .select()
      .single();

    if (error) {
      console.error('Error marking as paid:', error);
      toast.error('Erro ao marcar como pago');
      return;
    }

    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);

    const newPayment = mapPaymentRow(insertedPayment);
    setInvoices((prev) =>
      prev.map((inv) => inv.id === id ? {
        ...inv,
        payments: [...(inv.payments ?? []), newPayment],
        status: 'paid' as InvoiceStatus,
        paidAt: new Date().toISOString(),
      } : inv)
    );
  }, [invoices, user]);

  const markAsPending = useCallback(async (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) return;

    const newStatus = getStatusByDueDate(invoice.dueDate);

    // Delete all payments for this invoice
    await supabase.from('invoice_payments').delete().eq('invoice_id', id);
    await supabase.from('invoices').update({ status: newStatus, paid_at: null }).eq('id', id);

    setInvoices((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: newStatus, paidAt: undefined, payments: [] } : inv)
    );
  }, [invoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Erro ao excluir cobrança');
      return;
    }
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  const deletePatientInvoices = useCallback(async (patientId: string) => {
    const { error } = await supabase.from('invoices').delete().eq('patient_id', patientId);
    if (error) {
      console.error('Error deleting patient invoices:', error);
      toast.error('Erro ao excluir cobranças do paciente');
      return;
    }
    setInvoices((prev) => prev.filter((inv) => inv.patientId !== patientId));
  }, []);

  const updatePendingInvoiceAmounts = useCallback(async (patientId: string, newAmount: number): Promise<number> => {
    const today = startOfDay(new Date());
    const idsToUpdate = invoices
      .filter((inv) => {
        if (inv.patientId !== patientId) return false;
        if (inv.type !== 'monthly') return false;
        if (inv.status === 'paid' || inv.status === 'overdue') return false;
        const dueDate = startOfDay(new Date(inv.dueDate));
        return !isBefore(dueDate, today);
      })
      .map((inv) => inv.id);

    if (idsToUpdate.length === 0) return 0;

    const { error } = await supabase
      .from('invoices')
      .update({ amount: newAmount })
      .in('id', idsToUpdate);

    if (error) {
      console.error('Error updating invoice amounts:', error);
      toast.error('Erro ao atualizar valores');
      return 0;
    }

    setInvoices((prev) =>
      prev.map((inv) => idsToUpdate.includes(inv.id) ? { ...inv, amount: newAmount } : inv)
    );

    return idsToUpdate.length;
  }, [invoices]);

  const getPatientInvoices = useCallback((patientId: string) => {
    return invoices.filter((inv) => inv.patientId === patientId);
  }, [invoices]);

  const stats = useMemo(() => {
    const pending = invoices.filter((i) => i.status === 'pending');
    const overdue = invoices.filter((i) => i.status === 'overdue');
    const paid = invoices.filter((i) => i.status === 'paid');
    return {
      pendingCount: pending.length,
      pendingTotal: pending.reduce((sum, i) => sum + getInvoiceRemainingAmount(i), 0),
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((sum, i) => sum + getInvoiceRemainingAmount(i), 0),
      paidCount: paid.length,
      paidTotal: paid.reduce((sum, i) => sum + getInvoicePaidAmount(i), 0),
    };
  }, [invoices]);

  const getInvoicesByMonth = useCallback((year: number, month: number) => {
    return invoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      return dueDate.getFullYear() === year && dueDate.getMonth() === month;
    });
  }, [invoices]);

  // Get total income from invoice payments made in a specific month (regardless of invoice due date)
  const getInvoiceIncomeByPaymentMonth = useCallback((year: number, month: number) => {
    let total = 0;
    for (const inv of invoices) {
      const payments = inv.payments ?? [];
      for (const p of payments) {
        const pDate = new Date(p.paymentDate);
        if (pDate.getFullYear() === year && pDate.getMonth() === month) {
          total += p.amount;
        }
      }
      // For invoices marked paid without explicit payments (legacy), use paidAt date
      if (inv.status === 'paid' && payments.length === 0 && inv.paidAt) {
        const paidDate = new Date(inv.paidAt);
        if (paidDate.getFullYear() === year && paidDate.getMonth() === month) {
          total += inv.amount;
        }
      }
    }
    return total;
  }, [invoices]);

  // Get pending/overdue invoices for a month (by due date, excluding already paid ones)
  const getInvoicesPendingByMonth = useCallback((year: number, month: number) => {
    return invoices.filter((inv) => {
      if (inv.status === 'paid') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate.getFullYear() === year && dueDate.getMonth() === month;
    });
  }, [invoices]);

  const createExtraInvoice = useCallback(async (data: {
    patientId: string;
    patientName: string;
    amount: number;
    dueDate: Date;
    type: InvoiceType;
    description?: string;
    installments?: number;
    billingMethod?: string;
    interestRateMonthly?: number;
    fineRate?: number;
    gracePeriodDays?: number;
  }) => {
    if (!user) return;
    const today = startOfDay(new Date());
    const numInstallments = data.installments || 1;
    const installmentAmount = Math.round((data.amount / numInstallments) * 100) / 100;
    const rows: any[] = [];

    for (let i = 0; i < numInstallments; i++) {
      const dueDateStart = startOfDay(addMonths(data.dueDate, i));
      rows.push({
        user_id: user.id,
        patient_id: data.patientId,
        patient_name: data.patientName,
        amount: i === numInstallments - 1
          ? Math.round((data.amount - installmentAmount * (numInstallments - 1)) * 100) / 100
          : installmentAmount,
        due_date: dueDateStart.toISOString(),
        installment_number: i + 1,
        total_installments: numInstallments,
        status: isBefore(dueDateStart, today) ? 'overdue' : 'pending',
        type: data.type,
        interest_rate_monthly: data.interestRateMonthly ?? 0,
        fine_rate: data.fineRate ?? 0,
        grace_period_days: data.gracePeriodDays ?? 0,
        billing_method: data.billingMethod ?? '',
        description: data.description || null,
      });
    }

    const { data: inserted, error } = await supabase
      .from('invoices')
      .insert(rows)
      .select();

    if (error) {
      console.error('Error creating extra invoice:', error);
      toast.error('Erro ao criar cobrança avulsa');
      return;
    }

    const newInvoices = (inserted || []).map((row) => mapRow(row, []));
    setInvoices((prev) => [...newInvoices, ...prev]);
    toast.success(`Cobrança avulsa criada com sucesso${numInstallments > 1 ? ` (${numInstallments} parcelas)` : ''}`);
  }, [user]);

  return {
    invoices,
    isLoading,
    stats,
    generateInvoicesForPatient,
    createExtraInvoice,
    addPayment,
    markAsPaid,
    markAsPending,
    deleteInvoice,
    deletePatientInvoices,
    getPatientInvoices,
    getInvoicesByMonth,
    getInvoiceIncomeByPaymentMonth,
    getInvoicesPendingByMonth,
    getInvoicePaidAmount,
    getInvoiceRemainingAmount,
    getInvoiceInterest: getInvoiceInterest,
    getInvoiceTotalDue: getInvoiceTotalDue,
    updatePendingInvoiceAmounts,
  };
}
