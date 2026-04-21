import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Clock, Users, Target, Receipt, FileText, Bell, LogOut, Shield, BarChart3, Wallet, DollarSign, Download } from 'lucide-react';
import { MonthlyComparisonChart } from '@/components/MonthlyComparisonChart';
import { exportMonthlyReport } from '@/utils/exportMonthlyReport';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { TransactionList, DisplayTransaction } from '@/components/TransactionList';
import { MonthSelector } from '@/components/MonthSelector';
import { DueAlerts } from '@/components/DueAlerts';
import { BillForm } from '@/components/bills/BillForm';
import { useTransactions } from '@/hooks/useTransactions';
import { usePatients } from '@/hooks/usePatients';
import { useInvoices } from '@/hooks/useInvoices';
import { useBills } from '@/hooks/useBills';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Invoice } from '@/types/invoice';
import { Bill } from '@/types/bill';
import { Transaction } from '@/types/transaction';
import { billPaymentMethodLabels } from '@/types/bill';
import { invoiceTypeLabels, invoicePaymentMethodLabels } from '@/types/invoice';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function MergedTransactionList({
  selectedMonth,
  transactions,
  invoices,
  bills,
  getBillsByMonth,
  getInvoicePaidAmount,
  onDelete,
}: {
  selectedMonth: Date;
  transactions: Transaction[];
  invoices: Invoice[];
  bills: Bill[];
  getBillsByMonth: (y: number, m: number) => Bill[];
  getInvoicePaidAmount: (inv: Invoice) => number;
  onDelete: (id: string) => void;
}) {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  const mergedTransactions: DisplayTransaction[] = useMemo(() => {
    // Manual transactions
    const manual: DisplayTransaction[] = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      category: t.category,
      amount: t.amount,
      date: t.date,
      source: 'manual' as const,
    }));

    // Paid invoices — use payment dates to place in correct month
    const invoiceEntries: DisplayTransaction[] = [];
    for (const inv of invoices) {
      const payments = inv.payments ?? [];
      for (const p of payments) {
        const pDate = new Date(p.paymentDate);
        if (pDate.getFullYear() === year && pDate.getMonth() === month) {
          invoiceEntries.push({
            id: `inv-${inv.id}-${p.id}`,
            type: 'income',
            description: `${inv.patientName} - ${invoiceTypeLabels[inv.type] || inv.type} ${inv.installmentNumber}/${inv.totalInstallments}`,
            category: invoicePaymentMethodLabels[p.method] || p.method,
            amount: p.amount,
            date: format(pDate, 'yyyy-MM-dd'),
            source: 'invoice' as const,
          });
        }
      }
      // Legacy: paid without payment records
      if (inv.status === 'paid' && payments.length === 0 && inv.paidAt) {
        const paidDate = new Date(inv.paidAt);
        if (paidDate.getFullYear() === year && paidDate.getMonth() === month) {
          invoiceEntries.push({
            id: `inv-${inv.id}`,
            type: 'income',
            description: `${inv.patientName} - ${invoiceTypeLabels[inv.type] || inv.type} ${inv.installmentNumber}/${inv.totalInstallments}`,
            category: 'Cobrança',
            amount: inv.amount,
            date: format(paidDate, 'yyyy-MM-dd'),
            source: 'invoice' as const,
          });
        }
      }
    }

    // Paid bills
    const monthBills = getBillsByMonth(year, month);
    const billEntries: DisplayTransaction[] = monthBills
      .filter((b) => b.status === 'paid')
      .map((b) => ({
        id: `bill-${b.id}`,
        type: 'expense' as const,
        description: b.description + (b.totalInstallments ? ` ${b.installmentNumber}/${b.totalInstallments}` : ''),
        category: b.paymentMethod ? (billPaymentMethodLabels[b.paymentMethod] || b.paymentMethod) : 'Conta',
        amount: b.paidAmount ?? b.amount,
        date: b.paymentDate ? format(new Date(b.paymentDate), 'yyyy-MM-dd') : format(new Date(b.dueDate), 'yyyy-MM-dd'),
        source: 'bill' as const,
      }));

    return [...manual, ...invoiceEntries, ...billEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, invoices, getBillsByMonth, year, month]);

  return <TransactionList transactions={mergedTransactions} onDelete={onDelete} />;
}

const Index = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { transactions, allTransactions, stats, getChartData, deleteTransaction, isLoading } = useTransactions(selectedMonth);
  const { patients, patientsByWard } = usePatients();
  const { invoices, getInvoicesByMonth, getInvoiceIncomeByPaymentMonth, getInvoicesPendingByMonth, getInvoicePaidAmount, getInvoiceRemainingAmount } = useInvoices();
  const { bills, addBill, getBillsByMonth } = useBills();
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  // Aggregate stats from all sources (transactions + bills + invoices)
  const aggregatedStats = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    // === INVOICES - Income by PAYMENT DATE (not due date) ===
    const invoiceActualIncome = getInvoiceIncomeByPaymentMonth(year, month);

    // Pending/overdue invoices by DUE DATE (only unpaid ones)
    const pendingInvoices = getInvoicesPendingByMonth(year, month);
    const invoicePendingTotal = pendingInvoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + getInvoiceRemainingAmount(inv), 0);
    const invoiceOverdueTotal = pendingInvoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + getInvoiceRemainingAmount(inv), 0);

    // === BILLS (Contas a Pagar) - Saídas ===
    const monthBills = getBillsByMonth(year, month);
    const billsPaidExpense = monthBills
      .filter((b) => b.status === 'paid')
      .reduce((sum, b) => sum + (b.paidAmount ?? b.amount), 0);
    const billsPendingExpense = monthBills
      .filter((b) => b.status === 'pending' || b.status === 'overdue')
      .reduce((sum, b) => sum + b.amount, 0);

    // === TRANSACTIONS (Lançamentos manuais) ===
    const txActualIncome = stats.actualIncome;
    const txPendingTotal = stats.pendingTotal;
    const txExpense = stats.monthExpense;

    // === TOTALS ===
    const totalActualIncome = txActualIncome + invoiceActualIncome;
    const totalPendingIncome = txPendingTotal + invoicePendingTotal + invoiceOverdueTotal;
    const totalExpectedIncome = totalActualIncome + totalPendingIncome;
    const totalExpense = txExpense + billsPaidExpense;
    const totalExpenseExpected = txExpense + billsPaidExpense + billsPendingExpense;

    // Saldo anterior - income from invoice payments in prior months
    const prevBillsPaid = bills
      .filter((b) => {
        const d = new Date(b.dueDate);
        return d < new Date(year, month, 1) && b.status === 'paid';
      })
      .reduce((sum, b) => sum + (b.paidAmount ?? b.amount), 0);

    // Sum all invoice payments made before this month
    let prevInvoicesPaidByPayment = 0;
    for (const inv of invoices) {
      const payments = inv.payments ?? [];
      for (const p of payments) {
        const pDate = new Date(p.paymentDate);
        if (pDate < new Date(year, month, 1)) {
          prevInvoicesPaidByPayment += p.amount;
        }
      }
      // Legacy paid without payments
      if (inv.status === 'paid' && payments.length === 0 && inv.paidAt) {
        const paidDate = new Date(inv.paidAt);
        if (paidDate < new Date(year, month, 1)) {
          prevInvoicesPaidByPayment += inv.amount;
        }
      }
    }

    const previousBalance = stats.previousBalance + prevInvoicesPaidByPayment - prevBillsPaid;
    const balance = previousBalance + totalActualIncome - totalExpense;

    // Ticket médio — only monthly/enrollment, by payment date in this month
    const monthInvoices = getInvoicesByMonth(year, month);
    // Only count patients whose payments were actually received this month
    const patientPaymentsThisMonth = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.type !== 'monthly' && inv.type !== 'enrollment') continue;
      const payments = inv.payments ?? [];
      for (const p of payments) {
        const pDate = new Date(p.paymentDate);
        if (pDate.getFullYear() === year && pDate.getMonth() === month) {
          patientPaymentsThisMonth.set(inv.patientId, (patientPaymentsThisMonth.get(inv.patientId) || 0) + p.amount);
        }
      }
      if (inv.status === 'paid' && payments.length === 0 && inv.paidAt) {
        const paidDate = new Date(inv.paidAt);
        if (paidDate.getFullYear() === year && paidDate.getMonth() === month && (inv.type === 'monthly' || inv.type === 'enrollment')) {
          patientPaymentsThisMonth.set(inv.patientId, (patientPaymentsThisMonth.get(inv.patientId) || 0) + inv.amount);
        }
      }
    }
    const uniquePatients = patientPaymentsThisMonth.size;
    const totalPatientPayments = Array.from(patientPaymentsThisMonth.values()).reduce((a, b) => a + b, 0);

    // If no payments yet this month, use pending/overdue invoices as forecast
    const pendingMonthlyInvoices = monthInvoices.filter(
      (inv) => inv.status !== 'paid' && (inv.type === 'monthly' || inv.type === 'enrollment')
    );
    const pendingPatients = new Set(pendingMonthlyInvoices.map((inv) => inv.patientId));
    const pendingTotal = pendingMonthlyInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const txTicketMedio = stats.ticketMedio;

    let ticketMedio: number;
    if (uniquePatients > 0) {
      // There are actual payments this month — use real data
      ticketMedio = (totalPatientPayments + (txTicketMedio > 0 ? txTicketMedio : 0)) / (uniquePatients + (txTicketMedio > 0 ? 1 : 0));
    } else if (pendingPatients.size > 0) {
      // No payments yet but there are pending invoices — show forecast
      ticketMedio = pendingTotal / pendingPatients.size;
    } else {
      ticketMedio = txTicketMedio;
    }

    // Previous month comparison
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthInvoiceIncome = getInvoiceIncomeByPaymentMonth(prevMonth.getFullYear(), prevMonth.getMonth());

    const prevMonthBills = getBillsByMonth(prevMonth.getFullYear(), prevMonth.getMonth());
    const prevMonthBillExpense = prevMonthBills
      .filter((b) => b.status === 'paid')
      .reduce((sum, b) => sum + (b.paidAmount ?? b.amount), 0);

    const ticketMedioIsForecast = uniquePatients === 0 && pendingPatients.size > 0;

    return {
      expectedIncome: totalExpectedIncome,
      actualIncome: totalActualIncome,
      pendingTotal: totalPendingIncome,
      ticketMedio,
      ticketMedioIsForecast,
      previousBalance,
      monthExpense: totalExpense,
      balance,
      prevMonthIncome: stats.prevMonthIncome + prevMonthInvoiceIncome,
      prevMonthExpense: stats.prevMonthExpense + prevMonthBillExpense,
    };
  }, [selectedMonth, stats, bills, invoices, getInvoicesByMonth, getInvoiceIncomeByPaymentMonth, getInvoicesPendingByMonth, getBillsByMonth, getInvoiceRemainingAmount]);

  // Callback for monthly comparison chart - returns income/expense for any month
  const getMonthlyData = useCallback((year: number, month: number) => {
    // Invoice income by payment date
    const invoiceIncome = getInvoiceIncomeByPaymentMonth(year, month);

    const mBills = getBillsByMonth(year, month);
    const billExpense = mBills
      .filter((b) => b.status === 'paid')
      .reduce((sum, b) => sum + (b.paidAmount ?? b.amount), 0);

    const monthTx = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const txIncome = monthTx
      .filter((t) => t.type === 'income' && (t.status === 'paid' || !t.status))
      .reduce((acc, t) => acc + t.amount, 0);
    const txExpense = monthTx
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      income: txIncome + invoiceIncome,
      expense: txExpense + billExpense,
    };
  }, [getInvoiceIncomeByPaymentMonth, getBillsByMonth, allTransactions]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Complexo Terapêutico" className="h-12 w-auto" />
            <div>
              <h1 className="text-lg font-bold">CONTROLE DE CAIXA</h1>
              <p className="text-xs text-muted-foreground">COMPLEXO TERAPÊUTICO</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/pacientes">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Pacientes
              </Button>
            </Link>
            <Link to="/cobrancas">
              <Button variant="outline" size="sm" className="gap-2">
                <Receipt className="h-4 w-4" />
                Cobranças
              </Button>
            </Link>
            <Link to="/contas">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Contas
              </Button>
            </Link>
            <Link to="/relatorios">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Relatórios
              </Button>
            </Link>
            <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Previsão de Entradas"
            value={formatCurrency(aggregatedStats.expectedIncome)}
            icon={<Target className="h-6 w-6" />}
            variant="default"
          />
          <StatCard
            title="Entradas Atuais"
            value={formatCurrency(aggregatedStats.actualIncome)}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="income"
            trend={aggregatedStats.prevMonthIncome > 0 ? `Mês anterior: ${formatCurrency(aggregatedStats.prevMonthIncome)}` : undefined}
          />
          <StatCard
            title="Valores Pendentes"
            value={formatCurrency(aggregatedStats.pendingTotal)}
            icon={<Clock className="h-6 w-6" />}
            variant="expense"
          />
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(aggregatedStats.ticketMedio)}
            icon={<Users className="h-6 w-6" />}
            variant="balance"
            trend={aggregatedStats.ticketMedioIsForecast ? '📊 Previsão (sem pagamentos ainda)' : undefined}
          />
        </div>

        {/* Patient Stats + Balance */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Pacientes Ala Feminina"
            value={patientsByWard.feminina.toString()}
            icon={<Users className="h-6 w-6" />}
            variant="default"
          />
          <StatCard
            title="Pacientes Ala Masculina"
            value={patientsByWard.masculina.toString()}
            icon={<Users className="h-6 w-6" />}
            variant="default"
          />
          <StatCard
            title="Saídas"
            value={formatCurrency(aggregatedStats.monthExpense)}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="expense"
            trend={aggregatedStats.prevMonthExpense > 0 ? `Mês anterior: ${formatCurrency(aggregatedStats.prevMonthExpense)}` : undefined}
          />
          <StatCard
            title="Saldo Anterior"
            value={formatCurrency(aggregatedStats.previousBalance)}
            icon={<Wallet className="h-6 w-6" />}
            variant={aggregatedStats.previousBalance >= 0 ? 'balance' : 'expense'}
          />
          <StatCard
            title="Fechamento de Caixa"
            value={formatCurrency(aggregatedStats.balance)}
            icon={<DollarSign className="h-6 w-6" />}
            variant={aggregatedStats.balance >= 0 ? 'income' : 'expense'}
            trend={`Anterior + Entradas - Saídas`}
          />
        </div>



        {/* Monthly Comparison Chart */}
        <div className="mb-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-slide-up">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Comparativo Mensal</h2>
            </div>
            <MonthlyComparisonChart
              selectedMonth={selectedMonth}
              getMonthlyData={getMonthlyData}
            />
          </div>
        </div>

        {/* Alerts and Transactions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Due Alerts */}
          <div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-slide-up h-full">
              <div className="mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Vencimentos</h2>
              </div>
              <DueAlerts />
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-slide-up h-full" style={{ animationDelay: '100ms' }}>
              <h2 className="mb-4 text-lg font-semibold">Transações do Mês</h2>
              <MergedTransactionList
                selectedMonth={selectedMonth}
                transactions={transactions}
                invoices={invoices}
                bills={bills}
                getBillsByMonth={getBillsByMonth}
                getInvoicePaidAmount={getInvoicePaidAmount}
                onDelete={deleteTransaction}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
