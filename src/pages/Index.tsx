import logo from "@/assets/logo.png";
import { DateRange, getPresetRange } from "@/components/DateRangeSelector";
import { DueAlerts } from "@/components/DueAlerts";
import { MonthSelector } from "@/components/MonthSelector";
import { StatCard } from "@/components/StatCard";
import {
  DisplayTransaction,
  TransactionList,
} from "@/components/TransactionList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBills } from "@/hooks/useBills";
import { useInvoices } from "@/hooks/useInvoices";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePatients } from "@/hooks/usePatients";
import { useTransactions } from "@/hooks/useTransactions";
import { Bill, billPaymentMethodLabels } from "@/types/bill";
import {
  Invoice,
  invoicePaymentMethodLabels,
  invoiceTypeLabels,
} from "@/types/invoice";
import { Transaction } from "@/types/transaction";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import {
  BarChart3,
  Bell,
  Clock,
  DollarSign,
  FileText,
  LogOut,
  Receipt,
  ScrollText,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// Inline type — avoids importing from the lazy-loaded chart module
type ChartDataPoint = { label: string; expected: number; actual: number };

// Lazy-load the recharts-based chart so the heavy recharts bundle is NOT
// included in the initial JS payload. It will be fetched only after the
// page shell has painted (fixes TBT / FCP regressions from recharts).
const MonthlyComparisonChart = lazy(() =>
  import("@/components/MonthlyComparisonChart").then((m) => ({
    default: m.MonthlyComparisonChart,
  }))
);

const IncomeExpenseComparisonChart = lazy(() =>
  import("@/components/IncomeExpenseComparisonChart").then((m) => ({
    default: m.IncomeExpenseComparisonChart,
  }))
);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
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
      source: "manual" as const,
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
            type: "income",
            description: `${inv.patientName} - ${
              invoiceTypeLabels[inv.type] || inv.type
            } ${inv.installmentNumber}/${inv.totalInstallments}`,
            category: invoicePaymentMethodLabels[p.method] || p.method,
            amount: p.amount,
            date: format(pDate, "yyyy-MM-dd"),
            source: "invoice" as const,
          });
        }
      }
      // Legacy: paid without payment records
      if (inv.status === "paid" && payments.length === 0 && inv.paidAt) {
        const paidDate = new Date(inv.paidAt);
        if (paidDate.getFullYear() === year && paidDate.getMonth() === month) {
          invoiceEntries.push({
            id: `inv-${inv.id}`,
            type: "income",
            description: `${inv.patientName} - ${
              invoiceTypeLabels[inv.type] || inv.type
            } ${inv.installmentNumber}/${inv.totalInstallments}`,
            category: "Cobrança",
            amount: inv.amount,
            date: format(paidDate, "yyyy-MM-dd"),
            source: "invoice" as const,
          });
        }
      }
    }

    // Paid bills
    const monthBills = getBillsByMonth(year, month);
    const billEntries: DisplayTransaction[] = monthBills
      .filter((b) => b.status === "paid")
      .map((b) => ({
        id: `bill-${b.id}`,
        type: "expense" as const,
        description:
          b.description +
          (b.totalInstallments
            ? ` ${b.installmentNumber}/${b.totalInstallments}`
            : ""),
        category: b.paymentMethod
          ? billPaymentMethodLabels[b.paymentMethod] || b.paymentMethod
          : "Conta",
        amount: b.paidAmount ?? b.amount,
        date: b.paymentDate
          ? format(new Date(b.paymentDate), "yyyy-MM-dd")
          : format(new Date(b.dueDate), "yyyy-MM-dd"),
        source: "bill" as const,
      }));

    return [...manual, ...invoiceEntries, ...billEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, invoices, getBillsByMonth, year, month]);

  return (
    <TransactionList transactions={mergedTransactions} onDelete={onDelete} />
  );
}

// Build an array of daily buckets between from and to (inclusive, max 62 days)
function buildDailyBuckets(from: Date, to: Date): Date[] {
  const buckets: Date[] = [];
  let cursor = startOfDay(from);
  const end = startOfDay(to);
  let safety = 0;
  while (cursor <= end && safety < 62) {
    buckets.push(cursor);
    cursor = addDays(cursor, 1);
    safety++;
  }
  return buckets;
}

const Index = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Independent date-range state for each chart (default: current week)
  const [incomeDateRange, setIncomeDateRange] = useState<DateRange>(() =>
    getPresetRange("week", new Date())
  );
  const [expenseDateRange, setExpenseDateRange] = useState<DateRange>(() =>
    getPresetRange("week", new Date())
  );

  const {
    transactions,
    allTransactions,
    stats,
    getChartData,
    deleteTransaction,
    isLoading,
  } = useTransactions(selectedMonth);
  const { patients, patientsByWard } = usePatients();
  const {
    invoices,
    getInvoicesByMonth,
    getInvoiceIncomeByPaymentMonth,
    getInvoicesPendingByMonth,
    getInvoicePaidAmount,
    getInvoiceRemainingAmount,
    getInvoiceIncomeByDateRange,
    getInvoiceExpectedIncomeByDateRange,
  } = useInvoices();

  // Forecast: patients whose last monthly installment falls in next 1 or 3 months
  const wardLeavingForecast = useMemo(() => {
    const today = new Date();
    const counts = {
      feminina: { nextMonth: 0, next3Months: 0 },
      masculina: { nextMonth: 0, next3Months: 0 },
    };
    const patientMap: Record<string, { name: string; ward: string }> = {};
    patients.forEach((p) => {
      patientMap[p.id] = { name: p.name, ward: p.ward };
    });

    // Find each patient's last monthly installment due date
    const lastInstallmentByPatient: Record<string, { dueDate: Date }> = {};
    for (const inv of invoices) {
      if (inv.type !== "monthly") continue;
      if (inv.installmentNumber !== inv.totalInstallments) continue;
      lastInstallmentByPatient[inv.patientId] = {
        dueDate: new Date(inv.dueDate),
      };
    }

    // "Próx. mês": de hoje até o fim do mês calendário seguinte
    const endOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 2,
      0,
      23,
      59,
      59,
      999
    );
    // "3 meses": de hoje até o fim do 3º mês calendário seguinte
    const endOfThirdMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 4,
      0,
      23,
      59,
      59,
      999
    );

    const retentionList: {
      nextMonth: { patientId: string; name: string; ward: string; dueDate: Date }[];
      next3Months: { patientId: string; name: string; ward: string; dueDate: Date }[];
    } = { nextMonth: [], next3Months: [] };

    for (const [patientId, { dueDate }] of Object.entries(
      lastInstallmentByPatient
    )) {
      const patient = patientMap[patientId];
      const ward = patient?.ward as "feminina" | "masculina";
      if (!ward || !(ward in counts)) continue;
      if (dueDate < today) continue;
      if (dueDate <= endOfNextMonth) {
        counts[ward].nextMonth++;
        retentionList.nextMonth.push({
          patientId,
          name: patient.name,
          ward,
          dueDate,
        });
      }
      if (dueDate <= endOfThirdMonth) {
        counts[ward].next3Months++;
        retentionList.next3Months.push({
          patientId,
          name: patient.name,
          ward,
          dueDate,
        });
      }
    }
    retentionList.nextMonth.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    retentionList.next3Months.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return { ...counts, retentionList };
  }, [invoices, patients]);

  const WARD_CAPACITY = { feminina: 21, masculina: 47 } as const;

  const wardOccupancy = useMemo(() => {
    const today = new Date();
    const endOfThirdMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 4,
      0
    );
    const weeksTo3Months = Math.max(
      (endOfThirdMonth.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000),
      1
    );

    const build = (ward: "feminina" | "masculina") => {
      const capacity = WARD_CAPACITY[ward];
      const current = patientsByWard[ward];
      const projectedNextMonth = current - wardLeavingForecast[ward].nextMonth;
      const projected3Months = current - wardLeavingForecast[ward].next3Months;

      const currentRate = (current / capacity) * 100;
      const nextMonthRate = (projectedNextMonth / capacity) * 100;
      const rate3Months = (projected3Months / capacity) * 100;

      const freeSpots3Months = Math.max(capacity - projected3Months, 0);

      return {
        capacity,
        currentRate,
        nextMonthRate,
        rate3Months,
        freeSpotsCurrent: Math.max(capacity - current, 0),
        freeSpotsNextMonth: Math.max(capacity - projectedNextMonth, 0),
        freeRateNextMonth: Math.max(100 - nextMonthRate, 0),
        freeSpots3Months,
        freeRate3Months: Math.max(100 - rate3Months, 0),
        admissionsPerWeekNeeded: freeSpots3Months / weeksTo3Months,
      };
    };
    return { feminina: build("feminina"), masculina: build("masculina") };
  }, [patientsByWard, wardLeavingForecast]);

  const {
    bills,
    addBill,
    getBillsByMonth,
    getBillsActualExpenseByDateRange,
    getBillsExpectedExpenseByDateRange,
  } = useBills();
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
      .filter((inv) => inv.status === "pending")
      .reduce((sum, inv) => sum + getInvoiceRemainingAmount(inv), 0);
    const invoiceOverdueTotal = pendingInvoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + getInvoiceRemainingAmount(inv), 0);

    // === BILLS (Contas a Pagar) - Saídas ===
    const monthBills = getBillsByMonth(year, month);
    const billsPaidExpense = monthBills
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + (b.paidAmount ?? b.amount), 0);
    const billsPendingExpense = monthBills
      .filter((b) => b.status === "pending" || b.status === "overdue")
      .reduce((sum, b) => sum + b.amount, 0);

    // === TRANSACTIONS (Lançamentos manuais) ===
    const txActualIncome = stats.actualIncome;
    const txPendingTotal = stats.pendingTotal;
    const txExpense = stats.monthExpense;

    // === TOTALS ===
    const totalActualIncome = txActualIncome + invoiceActualIncome;
    const totalPendingIncome =
      txPendingTotal + invoicePendingTotal + invoiceOverdueTotal;
    const totalExpectedIncome = totalActualIncome + totalPendingIncome;
    const totalExpense = txExpense + billsPaidExpense;
    const totalExpenseExpected =
      txExpense + billsPaidExpense + billsPendingExpense;

    // Saldo anterior - income from invoice payments in prior months
    const prevBillsPaid = bills
      .filter((b) => {
        const d = new Date(b.dueDate);
        return d < new Date(year, month, 1) && b.status === "paid";
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
      if (inv.status === "paid" && payments.length === 0 && inv.paidAt) {
        const paidDate = new Date(inv.paidAt);
        if (paidDate < new Date(year, month, 1)) {
          prevInvoicesPaidByPayment += inv.amount;
        }
      }
    }

    const previousBalance =
      stats.previousBalance + prevInvoicesPaidByPayment - prevBillsPaid;
    const balance = previousBalance + totalActualIncome - totalExpense;

    // Ticket médio — only monthly/enrollment, by payment date in this month
    const monthInvoices = getInvoicesByMonth(year, month);
    // Only count patients whose payments were actually received this month
    const patientPaymentsThisMonth = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.type !== "monthly" && inv.type !== "enrollment") continue;
      const payments = inv.payments ?? [];
      for (const p of payments) {
        const pDate = new Date(p.paymentDate);
        if (pDate.getFullYear() === year && pDate.getMonth() === month) {
          patientPaymentsThisMonth.set(
            inv.patientId,
            (patientPaymentsThisMonth.get(inv.patientId) || 0) + p.amount
          );
        }
      }
      if (inv.status === "paid" && payments.length === 0 && inv.paidAt) {
        const paidDate = new Date(inv.paidAt);
        if (
          paidDate.getFullYear() === year &&
          paidDate.getMonth() === month &&
          (inv.type === "monthly" || inv.type === "enrollment")
        ) {
          patientPaymentsThisMonth.set(
            inv.patientId,
            (patientPaymentsThisMonth.get(inv.patientId) || 0) + inv.amount
          );
        }
      }
    }
    const uniquePatients = patientPaymentsThisMonth.size;
    const totalPatientPayments = Array.from(
      patientPaymentsThisMonth.values()
    ).reduce((a, b) => a + b, 0);

    // If no payments yet this month, use pending/overdue invoices as forecast
    const pendingMonthlyInvoices = monthInvoices.filter(
      (inv) =>
        inv.status !== "paid" &&
        (inv.type === "monthly" || inv.type === "enrollment")
    );
    const pendingPatients = new Set(
      pendingMonthlyInvoices.map((inv) => inv.patientId)
    );
    const pendingTotal = pendingMonthlyInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );

    const txTicketMedio = stats.ticketMedio;

    let ticketMedio: number;
    if (uniquePatients > 0) {
      // There are actual payments this month — use real data
      ticketMedio =
        (totalPatientPayments + (txTicketMedio > 0 ? txTicketMedio : 0)) /
        (uniquePatients + (txTicketMedio > 0 ? 1 : 0));
    } else if (pendingPatients.size > 0) {
      // No payments yet but there are pending invoices — show forecast
      ticketMedio = pendingTotal / pendingPatients.size;
    } else {
      ticketMedio = txTicketMedio;
    }

    // Previous month comparison
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthInvoiceIncome = getInvoiceIncomeByPaymentMonth(
      prevMonth.getFullYear(),
      prevMonth.getMonth()
    );

    const prevMonthBills = getBillsByMonth(
      prevMonth.getFullYear(),
      prevMonth.getMonth()
    );
    const prevMonthBillExpense = prevMonthBills
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + (b.paidAmount ?? b.amount), 0);

    const ticketMedioIsForecast =
      uniquePatients === 0 && pendingPatients.size > 0;

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
      totalExpenseExpected,
    };
  }, [
    selectedMonth,
    stats,
    bills,
    invoices,
    getInvoicesByMonth,
    getInvoiceIncomeByPaymentMonth,
    getInvoicesPendingByMonth,
    getBillsByMonth,
    getInvoiceRemainingAmount,
  ]);

  // Callback for monthly comparison chart - returns income/expense for any month
  const getMonthlyData = useCallback(
    (year: number, month: number) => {
      // Invoice income by payment date
      const invoiceIncome = getInvoiceIncomeByPaymentMonth(year, month);

      const mBills = getBillsByMonth(year, month);
      const billExpense = mBills
        .filter((b) => b.status === "paid")
        .reduce((sum, b) => sum + (b.paidAmount ?? b.amount), 0);

      const monthTx = allTransactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const txIncome = monthTx
        .filter(
          (t) => t.type === "income" && (t.status === "paid" || !t.status)
        )
        .reduce((acc, t) => acc + t.amount, 0);
      const txExpense = monthTx
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        income: txIncome + invoiceIncome,
        expense: txExpense + billExpense,
      };
    },
    [getInvoiceIncomeByPaymentMonth, getBillsByMonth, allTransactions]
  );

  // Compute daily chart data for the income chart
  const incomeChartData = useMemo((): ChartDataPoint[] => {
    const buckets = buildDailyBuckets(incomeDateRange.from, incomeDateRange.to);
    return buckets.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dateStr = format(day, "yyyy-MM-dd");

      // Actual: invoice payments on this day
      const invoiceActual = getInvoiceIncomeByDateRange(dayStart, dayEnd);
      // Actual: manual income transactions on this day
      const txActual = allTransactions
        .filter(
          (t) =>
            t.type === "income" &&
            (t.status === "paid" || !t.status) &&
            t.date === dateStr
        )
        .reduce((sum, t) => sum + t.amount, 0);

      // Expected: invoices due on this day
      const invoiceExpected = getInvoiceExpectedIncomeByDateRange(
        dayStart,
        dayEnd
      );
      // Expected: manual income transactions on this day (all statuses)
      const txExpected = allTransactions
        .filter((t) => t.type === "income" && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        label: format(day, "dd/MM"),
        expected: invoiceExpected + txExpected,
        actual: invoiceActual + txActual,
      };
    });
  }, [
    incomeDateRange,
    allTransactions,
    getInvoiceIncomeByDateRange,
    getInvoiceExpectedIncomeByDateRange,
  ]);

  // Compute daily chart data for the expense chart
  const expenseChartData = useMemo((): ChartDataPoint[] => {
    const buckets = buildDailyBuckets(
      expenseDateRange.from,
      expenseDateRange.to
    );
    return buckets.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dateStr = format(day, "yyyy-MM-dd");

      // Actual: bills paid on this day
      const billActual = getBillsActualExpenseByDateRange(dayStart, dayEnd);
      // Actual: manual expense transactions on this day
      const txActual = allTransactions
        .filter((t) => t.type === "expense" && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      // Expected: bills due on this day
      const billExpected = getBillsExpectedExpenseByDateRange(dayStart, dayEnd);
      // Expected: manual expense transactions on this day
      const txExpected = allTransactions
        .filter((t) => t.type === "expense" && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        label: format(day, "dd/MM"),
        expected: billExpected + txExpected,
        actual: billActual + txActual,
      };
    });
  }, [
    expenseDateRange,
    allTransactions,
    getBillsActualExpenseByDateRange,
    getBillsExpectedExpenseByDateRange,
  ]);

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
            <img
              src={logo}
              alt="Complexo Terapêutico"
              className="h-12 w-auto"
              width="48"
              height="48"
            />
            <div>
              <h1 className="text-lg font-bold">CONTROLE DE CAIXA</h1>
              <p className="text-xs text-muted-foreground">
                COMPLEXO TERAPÊUTICO
              </p>
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
            <MonthSelector
              selectedMonth={selectedMonth}
              onChange={setSelectedMonth}
            />
            {isAdmin && (
              <>
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
                <Link to="/logs">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ScrollText className="h-4 w-4" />
                    Logs
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-2 text-muted-foreground"
            >
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
            trend={
              aggregatedStats.prevMonthIncome > 0
                ? `Mês anterior: ${formatCurrency(
                    aggregatedStats.prevMonthIncome
                  )}`
                : undefined
            }
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
            trend={
              aggregatedStats.ticketMedioIsForecast
                ? "📊 Previsão (sem pagamentos ainda)"
                : undefined
            }
          />
        </div>

        {/* Balance Row */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Saídas"
            value={formatCurrency(aggregatedStats.monthExpense)}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="expense"
            trend={
              aggregatedStats.prevMonthExpense > 0
                ? `Mês anterior: ${formatCurrency(
                    aggregatedStats.prevMonthExpense
                  )}`
                : undefined
            }
          />
          <StatCard
            title="Saldo Anterior"
            value={formatCurrency(aggregatedStats.previousBalance)}
            icon={<Wallet className="h-6 w-6" />}
            variant={
              aggregatedStats.previousBalance >= 0 ? "balance" : "expense"
            }
          />
          <StatCard
            title="Fechamento de Caixa"
            value={formatCurrency(aggregatedStats.balance)}
            icon={<DollarSign className="h-6 w-6" />}
            variant={aggregatedStats.balance >= 0 ? "income" : "expense"}
            trend={`Anterior + Entradas - Saídas`}
          />
        </div>

        {/* Patient Stats */}
        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          {/* Ala Feminina */}
          <div className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Pacientes Ala Feminina
                </p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold tracking-tight">
                    {patientsByWard.feminina}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    / {WARD_CAPACITY.feminina} vagas
                  </p>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Ocupação atual
                </p>
                <p className="text-sm font-semibold">
                  {wardOccupancy.feminina.currentRate.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Prev. próx. mês
                </p>
                <p className="text-sm font-semibold">
                  {wardOccupancy.feminina.nextMonthRate.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Prev. 3 meses
                </p>
                <p className="text-sm font-semibold">
                  {wardOccupancy.feminina.rate3Months.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="mt-2 pt-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                Estimativa de saída
              </p>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-orange-500">
                    {wardLeavingForecast.feminina.nextMonth}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    próx. mês
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-orange-400">
                    {wardLeavingForecast.feminina.next3Months}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    em 3 meses
                  </span>
                </div>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                Baseado nos contratos
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Margem livre para anunciar
              </p>
              <div className="mt-0.5 flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {wardOccupancy.feminina.freeSpotsNextMonth}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    vagas ({wardOccupancy.feminina.freeRateNextMonth.toFixed(0)}%) próx. mês
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {wardOccupancy.feminina.freeSpots3Months}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  vagas ({wardOccupancy.feminina.freeRate3Months.toFixed(0)}%) em 3 meses
                </span>
              </div>
              <p className="mt-1.5 border-t border-emerald-500/20 pt-1.5 text-[11px] text-muted-foreground">
                Meta:{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {wardOccupancy.feminina.admissionsPerWeekNeeded.toFixed(1)}
                </span>{" "}
                internações/semana p/ manter ocupação
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Potencial de faturamento adicional
              </p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(
                    wardOccupancy.feminina.freeSpotsCurrent *
                      aggregatedStats.ticketMedio
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  /mês com ocupação 100% ({wardOccupancy.feminina.freeSpotsCurrent}{" "}
                  vagas vazias × ticket médio)
                </span>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10 blur-2xl" />
          </div>

          {/* Ala Masculina */}
          <div className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Pacientes Ala Masculina
                </p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold tracking-tight">
                    {patientsByWard.masculina}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    / {WARD_CAPACITY.masculina} vagas
                  </p>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Ocupação atual
                </p>
                <p className="text-sm font-semibold">
                  {wardOccupancy.masculina.currentRate.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Prev. próx. mês
                </p>
                <p className="text-sm font-semibold">
                  {wardOccupancy.masculina.nextMonthRate.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Prev. 3 meses
                </p>
                <p className="text-sm font-semibold">
                  {wardOccupancy.masculina.rate3Months.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="mt-2 pt-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                Estimativa de saída
              </p>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-orange-500">
                    {wardLeavingForecast.masculina.nextMonth}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    próx. mês
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-orange-400">
                    {wardLeavingForecast.masculina.next3Months}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    em 3 meses
                  </span>
                </div>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                Baseado nos contratos
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Margem livre para anunciar
              </p>
              <div className="mt-0.5 flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {wardOccupancy.masculina.freeSpotsNextMonth}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    vagas ({wardOccupancy.masculina.freeRateNextMonth.toFixed(0)}%) próx. mês
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {wardOccupancy.masculina.freeSpots3Months}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  vagas ({wardOccupancy.masculina.freeRate3Months.toFixed(0)}%) em 3 meses
                </span>
              </div>
              <p className="mt-1.5 border-t border-emerald-500/20 pt-1.5 text-[11px] text-muted-foreground">
                Meta:{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {wardOccupancy.masculina.admissionsPerWeekNeeded.toFixed(1)}
                </span>{" "}
                internações/semana p/ manter ocupação
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Potencial de faturamento adicional
              </p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(
                    wardOccupancy.masculina.freeSpotsCurrent *
                      aggregatedStats.ticketMedio
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  /mês com ocupação 100% ({wardOccupancy.masculina.freeSpotsCurrent}{" "}
                  vagas vazias × ticket médio)
                </span>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10 blur-2xl" />
          </div>

          {/* Possibilidade de Retenção */}
          <div className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Possibilidade de retenção
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pacientes que podem ter seu contrato renovado ou ambulatorial
              oferecido
            </p>

            <Tabs defaultValue="nextMonth" className="mt-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nextMonth">
                  Próx. mês ({wardLeavingForecast.retentionList.nextMonth.length})
                </TabsTrigger>
                <TabsTrigger value="next3Months">
                  3 meses ({wardLeavingForecast.retentionList.next3Months.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="nextMonth">
                <ScrollArea className="h-64 pr-2">
                  {wardLeavingForecast.retentionList.nextMonth.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      Nenhum contrato vencendo no próximo mês
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {wardLeavingForecast.retentionList.nextMonth.map((p) => (
                        <div
                          key={p.patientId}
                          className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Badge
                              variant="outline"
                              className={
                                p.ward === "feminina"
                                  ? "shrink-0 border-pink-500/30 text-pink-600 dark:text-pink-400"
                                  : "shrink-0 border-blue-500/30 text-blue-600 dark:text-blue-400"
                              }
                            >
                              {p.ward === "feminina" ? "Fem" : "Masc"}
                            </Badge>
                            <span className="truncate text-sm">{p.name}</span>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {format(p.dueDate, "dd/MM")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="next3Months">
                <ScrollArea className="h-64 pr-2">
                  {wardLeavingForecast.retentionList.next3Months.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      Nenhum contrato vencendo nos próximos 3 meses
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {wardLeavingForecast.retentionList.next3Months.map((p) => (
                        <div
                          key={p.patientId}
                          className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Badge
                              variant="outline"
                              className={
                                p.ward === "feminina"
                                  ? "shrink-0 border-pink-500/30 text-pink-600 dark:text-pink-400"
                                  : "shrink-0 border-blue-500/30 text-blue-600 dark:text-blue-400"
                              }
                            >
                              {p.ward === "feminina" ? "Fem" : "Masc"}
                            </Badge>
                            <span className="truncate text-sm">{p.name}</span>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {format(p.dueDate, "dd/MM")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Monthly Comparison Chart — lazy-loaded so recharts doesn't block FCP */}
        <div className="mb-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-slide-up">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Comparativo Mensal</h2>
            </div>
            <Suspense
              fallback={
                <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                  Carregando gráfico…
                </div>
              }
            >
              <MonthlyComparisonChart
                selectedMonth={selectedMonth}
                getMonthlyData={getMonthlyData}
              />
            </Suspense>
          </div>
        </div>

        {/* New Charts */}
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-slide-up">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Entradas Previstas vs. Realizadas
              </h2>
            </div>
            <Suspense
              fallback={
                <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                  Carregando gráfico…
                </div>
              }
            >
              <IncomeExpenseComparisonChart
                type="income"
                data={incomeChartData}
                onDateRangeChange={setIncomeDateRange}
              />
            </Suspense>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-slide-up">
            <div className="mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Saídas Previstas vs. Realizadas
              </h2>
            </div>
            <Suspense
              fallback={
                <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                  Carregando gráfico…
                </div>
              }
            >
              <IncomeExpenseComparisonChart
                type="expense"
                data={expenseChartData}
                onDateRangeChange={setExpenseDateRange}
              />
            </Suspense>
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
            <div
              className="rounded-xl border border-border bg-card p-6 shadow-sm animate-slide-up h-full"
              style={{ animationDelay: "100ms" }}
            >
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
