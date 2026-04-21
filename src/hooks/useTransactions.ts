import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const mapRow = (row: any): Transaction => ({
  id: row.id,
  type: row.type,
  category: row.category,
  description: row.description,
  amount: Number(row.amount),
  date: row.date,
  status: row.status ?? undefined,
  patientId: row.patient_id ?? undefined,
  createdAt: row.created_at,
});

export function useTransactions(selectedMonth: Date) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (!user) { setTransactions([]); setIsLoading(false); return; }
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações');
    } else {
      setTransactions((data || []).map(mapRow));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const row = {
      user_id: user!.id,
      type: data.type,
      category: data.category,
      description: data.description,
      amount: data.amount,
      date: data.date,
      status: data.status ?? 'paid',
      patient_id: data.patientId ?? null,
    };

    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      toast.error('Erro ao adicionar transação');
      return;
    }

    setTransactions((prev) => [mapRow(inserted), ...prev]);
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao excluir transação');
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Filter transactions by selected month
  const monthTransactions = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  const stats = useMemo(() => {
    const incomeTransactions = monthTransactions.filter((t) => t.type === 'income');
    
    const paidIncome = incomeTransactions
      .filter((t) => t.status === 'paid' || !t.status)
      .reduce((acc, t) => acc + t.amount, 0);

    const pendingIncome = incomeTransactions
      .filter((t) => t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);

    const overdueIncome = incomeTransactions
      .filter((t) => t.status === 'overdue')
      .reduce((acc, t) => acc + t.amount, 0);

    const expectedIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
    const actualIncome = paidIncome;
    const pendingTotal = pendingIncome + overdueIncome;

    const monthExpense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    const previousBalance = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return date < new Date(year, month, 1);
      })
      .reduce((acc, t) => {
        if (t.type === 'income' && (t.status === 'paid' || !t.status)) return acc + t.amount;
        if (t.type === 'expense') return acc - t.amount;
        return acc;
      }, 0);

    const balance = previousBalance + actualIncome - monthExpense;

    const patientPayments = incomeTransactions.filter(
      (t) => t.patientId && (t.status === 'paid' || !t.status)
    );
    const uniquePatients = new Set(patientPayments.map((t) => t.patientId));
    const totalPatientPayments = patientPayments.reduce((acc, t) => acc + t.amount, 0);
    const ticketMedio = uniquePatients.size > 0 ? totalPatientPayments / uniquePatients.size : 0;

    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevYear = prevMonth.getFullYear();
    const prevMonthNum = prevMonth.getMonth();

    const prevMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === prevYear && date.getMonth() === prevMonthNum;
    });

    const prevMonthIncome = prevMonthTransactions
      .filter((t) => t.type === 'income' && (t.status === 'paid' || !t.status))
      .reduce((acc, t) => acc + t.amount, 0);

    const prevMonthExpense = prevMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenseByCategory = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      expectedIncome,
      actualIncome,
      pendingTotal,
      ticketMedio,
      previousBalance,
      monthIncome: actualIncome,
      monthExpense,
      balance,
      prevMonthIncome,
      prevMonthExpense,
      expenseByCategory,
      transactionCount: monthTransactions.length,
    };
  }, [monthTransactions, transactions, selectedMonth]);

  const getChartData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayTransactions = monthTransactions.filter((t) => t.date === dateStr);
      const income = dayTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = dayTransactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

      return { day: String(day), income, expense };
    });

    const weeklyData: { week: string; income: number; expense: number }[] = [];
    for (let i = 0; i < dailyData.length; i += 7) {
      const weekSlice = dailyData.slice(i, i + 7);
      const weekNum = Math.floor(i / 7) + 1;
      weeklyData.push({
        week: `Sem ${weekNum}`,
        income: weekSlice.reduce((acc, d) => acc + d.income, 0),
        expense: weekSlice.reduce((acc, d) => acc + d.expense, 0),
      });
    }

    return weeklyData;
  }, [monthTransactions, selectedMonth]);

  return {
    transactions: monthTransactions,
    allTransactions: transactions,
    isLoading,
    addTransaction,
    deleteTransaction,
    stats,
    getChartData,
  };
}
