import { useState, useEffect, useMemo, useCallback } from 'react';
import { Bill, BillStatus, BillRecurrence, BillPaymentMethod } from '@/types/bill';
import { isBefore, startOfDay, differenceInDays, addWeeks, addMonths, addYears } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AddBillData {
  description: string;
  amount: number;
  dueDate: Date;
  category: string;
  subcategory: string;
  recurrence?: BillRecurrence;
  installments?: number;
}

const mapRow = (row: any): Bill => ({
  id: row.id,
  description: row.description,
  amount: Number(row.amount),
  dueDate: row.due_date,
  category: row.category,
  subcategory: row.subcategory,
  status: row.status as BillStatus,
  recurrence: row.recurrence as BillRecurrence,
  installmentNumber: row.installment_number ?? undefined,
  totalInstallments: row.total_installments ?? undefined,
  paidAt: row.paid_at ?? undefined,
  paymentDate: row.payment_date ?? undefined,
  paidAmount: row.paid_amount != null ? Number(row.paid_amount) : undefined,
  paymentMethod: row.payment_method as BillPaymentMethod | undefined,
  createdAt: row.created_at,
});

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchBills = useCallback(async () => {
    if (!user) { setBills([]); setIsLoading(false); return; }
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bills:', error);
      toast.error('Erro ao carregar contas');
    } else {
      setBills((data || []).map(mapRow));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  // Auto-update overdue status
  useEffect(() => {
    if (bills.length === 0) return;
    const today = startOfDay(new Date());
    const updates: { id: string; status: BillStatus }[] = [];

    const updated = bills.map((bill) => {
      if (bill.status === 'paid') return bill;
      const dueDate = startOfDay(new Date(bill.dueDate));
      const newStatus: BillStatus = isBefore(dueDate, today) ? 'overdue' : 'pending';
      if (bill.status !== newStatus) {
        updates.push({ id: bill.id, status: newStatus });
        return { ...bill, status: newStatus };
      }
      return bill;
    });

    if (updates.length > 0) {
      setBills(updated);
      // Update in DB in background
      updates.forEach(({ id, status }) => {
        supabase.from('bills').update({ status }).eq('id', id).then();
      });
    }
  }, [bills.length]); // Only run when bills count changes (initial load)

  const getNextDueDate = (currentDueDate: Date, recurrence: BillRecurrence): Date => {
    switch (recurrence) {
      case 'weekly': return addWeeks(currentDueDate, 1);
      case 'biweekly': return addWeeks(currentDueDate, 2);
      case 'monthly': return addMonths(currentDueDate, 1);
      case 'yearly': return addYears(currentDueDate, 1);
      default: return currentDueDate;
    }
  };

  const getRecurrenceCount = (recurrence: BillRecurrence): number => {
    switch (recurrence) {
      case 'weekly': return 52;
      case 'biweekly': return 26;
      case 'monthly': return 12;
      case 'yearly': return 3;
      default: return 1;
    }
  };

  const addBill = useCallback(async (data: AddBillData) => {
    const today = startOfDay(new Date());
    const rows: any[] = [];
    const installments = data.installments || 1;
    const recurrence = data.recurrence || 'none';

    if (installments > 1) {
      for (let i = 0; i < installments; i++) {
        const dueDate = addMonths(startOfDay(data.dueDate), i);
        const status: BillStatus = isBefore(dueDate, today) ? 'overdue' : 'pending';
        rows.push({
          user_id: user!.id,
          description: data.description,
          amount: data.amount,
          due_date: dueDate.toISOString(),
          category: data.category,
          subcategory: data.subcategory,
          status,
          recurrence: 'none',
          installment_number: i + 1,
          total_installments: installments,
        });
      }
    } else if (recurrence !== 'none') {
      const count = getRecurrenceCount(recurrence);
      let currentDueDate = startOfDay(data.dueDate);
      for (let i = 0; i < count; i++) {
        const status: BillStatus = isBefore(currentDueDate, today) ? 'overdue' : 'pending';
        rows.push({
          user_id: user!.id,
          description: data.description,
          amount: data.amount,
          due_date: currentDueDate.toISOString(),
          category: data.category,
          subcategory: data.subcategory,
          status,
          recurrence,
        });
        currentDueDate = getNextDueDate(currentDueDate, recurrence);
      }
    } else {
      const dueDate = startOfDay(data.dueDate);
      const status: BillStatus = isBefore(dueDate, today) ? 'overdue' : 'pending';
      rows.push({
        user_id: user!.id,
        description: data.description,
        amount: data.amount,
        due_date: dueDate.toISOString(),
        category: data.category,
        subcategory: data.subcategory,
        status,
        recurrence: 'none',
      });
    }

    const { data: inserted, error } = await supabase
      .from('bills')
      .insert(rows)
      .select();

    if (error) {
      console.error('Error adding bills:', error);
      toast.error('Erro ao adicionar conta');
      return [];
    }

    const newBills = (inserted || []).map(mapRow);
    setBills((prev) => [...newBills, ...prev]);
    return newBills;
  }, [user]);

  const markAsPaid = useCallback(async (id: string, paymentDate?: Date, paidAmount?: number, paymentMethod?: BillPaymentMethod) => {
    const bill = bills.find((b) => b.id === id);
    if (!bill) return;

    const updates = {
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_date: paymentDate ? paymentDate.toISOString() : new Date().toISOString(),
      paid_amount: paidAmount ?? bill.amount,
      payment_method: paymentMethod ?? null,
    };

    const { error } = await supabase.from('bills').update(updates).eq('id', id);
    if (error) {
      console.error('Error marking bill as paid:', error);
      toast.error('Erro ao marcar conta como paga');
      return;
    }

    setBills((prev) =>
      prev.map((b) => b.id === id ? {
        ...b,
        status: 'paid' as BillStatus,
        paidAt: updates.paid_at,
        paymentDate: updates.payment_date,
        paidAmount: updates.paid_amount,
        paymentMethod: paymentMethod,
      } : b)
    );
  }, [bills]);

  const markAsPending = useCallback(async (id: string) => {
    const today = startOfDay(new Date());
    const bill = bills.find((b) => b.id === id);
    if (!bill) return;

    const dueDate = startOfDay(new Date(bill.dueDate));
    const newStatus: BillStatus = isBefore(dueDate, today) ? 'overdue' : 'pending';

    const { error } = await supabase.from('bills').update({
      status: newStatus,
      paid_at: null,
      payment_date: null,
      paid_amount: null,
      payment_method: null,
    }).eq('id', id);

    if (error) {
      console.error('Error marking bill as pending:', error);
      toast.error('Erro ao desfazer pagamento');
      return;
    }

    setBills((prev) =>
      prev.map((b) => b.id !== id ? b : { ...b, status: newStatus, paidAt: undefined, paymentDate: undefined, paidAmount: undefined, paymentMethod: undefined })
    );
  }, [bills]);

  const deleteBill = useCallback(async (id: string) => {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) {
      console.error('Error deleting bill:', error);
      toast.error('Erro ao excluir conta');
      return;
    }
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const deleteBillAndFuture = useCallback(async (id: string) => {
    const billToDelete = bills.find((b) => b.id === id);
    if (!billToDelete) return;

    if (billToDelete.recurrence === 'none') {
      await deleteBill(id);
      return;
    }

    const billDueDate = startOfDay(new Date(billToDelete.dueDate));
    const idsToDelete = bills
      .filter((b) => {
        if (b.description !== billToDelete.description ||
            b.category !== billToDelete.category ||
            b.subcategory !== billToDelete.subcategory ||
            b.recurrence !== billToDelete.recurrence) return false;
        const dueDate = startOfDay(new Date(b.dueDate));
        return !isBefore(dueDate, billDueDate);
      })
      .map((b) => b.id);

    const { error } = await supabase.from('bills').delete().in('id', idsToDelete);
    if (error) {
      console.error('Error deleting bills:', error);
      toast.error('Erro ao excluir contas');
      return;
    }

    setBills((prev) => prev.filter((b) => !idsToDelete.includes(b.id)));
  }, [bills, deleteBill]);

  const updateBill = useCallback(async (id: string, data: Partial<AddBillData>) => {
    const today = startOfDay(new Date());
    const bill = bills.find((b) => b.id === id);
    if (!bill) return;

    const updates: any = {};
    if (data.description !== undefined) updates.description = data.description;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.category !== undefined) updates.category = data.category;
    if (data.subcategory !== undefined) updates.subcategory = data.subcategory;
    if (data.recurrence !== undefined) updates.recurrence = data.recurrence;
    if (data.dueDate !== undefined) {
      updates.due_date = data.dueDate.toISOString();
      if (bill.status !== 'paid') {
        updates.status = isBefore(startOfDay(data.dueDate), today) ? 'overdue' : 'pending';
      }
    }

    const { error } = await supabase.from('bills').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating bill:', error);
      toast.error('Erro ao atualizar conta');
      return;
    }

    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updatedBill = { ...b };
        if (data.description !== undefined) updatedBill.description = data.description;
        if (data.amount !== undefined) updatedBill.amount = data.amount;
        if (data.category !== undefined) updatedBill.category = data.category;
        if (data.subcategory !== undefined) updatedBill.subcategory = data.subcategory;
        if (data.recurrence !== undefined) updatedBill.recurrence = data.recurrence;
        if (data.dueDate !== undefined) {
          updatedBill.dueDate = data.dueDate.toISOString();
          if (b.status !== 'paid') {
            updatedBill.status = isBefore(startOfDay(data.dueDate), today) ? 'overdue' : 'pending';
          }
        }
        return updatedBill;
      })
    );
  }, [bills]);

  const stats = useMemo(() => {
    const pending = bills.filter((b) => b.status === 'pending');
    const overdue = bills.filter((b) => b.status === 'overdue');
    const paid = bills.filter((b) => b.status === 'paid');
    return {
      pendingCount: pending.length,
      pendingTotal: pending.reduce((sum, b) => sum + b.amount, 0),
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((sum, b) => sum + b.amount, 0),
      paidCount: paid.length,
      paidTotal: paid.reduce((sum, b) => sum + (b.paidAmount ?? b.amount), 0),
    };
  }, [bills]);

  const upcomingBills = useMemo(() => {
    const today = startOfDay(new Date());
    return bills
      .filter((bill) => {
        if (bill.status === 'paid') return false;
        const dueDate = startOfDay(new Date(bill.dueDate));
        const daysUntilDue = differenceInDays(dueDate, today);
        return daysUntilDue >= 0 && daysUntilDue <= 7;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [bills]);

  const overdueBills = useMemo(() => {
    return bills
      .filter((bill) => bill.status === 'overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [bills]);

  const getBillsByMonth = useCallback((year: number, month: number) => {
    return bills.filter((bill) => {
      const dueDate = new Date(bill.dueDate);
      return dueDate.getFullYear() === year && dueDate.getMonth() === month;
    });
  }, [bills]);

  return {
    bills,
    isLoading,
    stats,
    upcomingBills,
    overdueBills,
    addBill,
    markAsPaid,
    markAsPending,
    deleteBill,
    deleteBillAndFuture,
    updateBill,
    getBillsByMonth,
  };
}
