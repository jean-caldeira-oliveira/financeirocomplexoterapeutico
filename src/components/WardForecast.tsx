import { Bill } from "@/types/bill";
import { Invoice } from "@/types/invoice";
import { Patient } from "@/types/transaction";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface WardForecastProps {
  invoices: Invoice[];
  bills: Bill[];
  patients: Patient[];
  getBillsByMonth: (year: number, month: number) => Bill[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type WardKey = "feminina" | "masculina" | "total";

interface ForecastPeriod {
  label: string;
  year: number;
  month: number;
}

interface WardForecastRow {
  ward: WardKey;
  label: string;
  periods: {
    grossIncome: number;
    expenses: number;
    net: number;
    invoiceCount: number;
  }[];
}

export function WardForecast({
  invoices,
  bills,
  patients,
  getBillsByMonth,
}: WardForecastProps) {
  // Build a map: patientId -> ward
  const patientWardMap = useMemo(() => {
    const map: Record<string, WardKey> = {};
    patients.forEach((p) => {
      map[p.id] = p.ward as WardKey;
    });
    return map;
  }, [patients]);

  // Forecast periods: next month and next 3 months (cumulative)
  const today = new Date();
  const periods: ForecastPeriod[] = useMemo(() => {
    const result: ForecastPeriod[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = addMonths(today, i);
      result.push({
        label: format(d, "MMMM/yyyy", { locale: ptBR }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.getFullYear(), today.getMonth()]);

  // For each period, compute expected income per ward (unpaid invoices due that month)
  // and expected expenses (pending/unpaid bills due that month)
  const forecastData = useMemo(() => {
    const wards: WardKey[] = ["feminina", "masculina", "total"];

    return wards.map((ward): WardForecastRow => {
      const periodData = periods.map((period) => {
        // Expected income: invoices due in this month that are not yet paid
        const monthInvoices = invoices.filter((inv) => {
          if (inv.status === "paid") return false;
          const d = new Date(inv.dueDate);
          if (d.getFullYear() !== period.year || d.getMonth() !== period.month)
            return false;
          if (ward === "total") return true;
          const patientWard = patientWardMap[inv.patientId];
          return patientWard === ward;
        });

        const grossIncome = monthInvoices.reduce(
          (sum, inv) => sum + inv.amount,
          0
        );
        const invoiceCount = monthInvoices.length;

        // Expected expenses: bills due in this month that are not yet paid
        // Bills are clinic-wide (not per ward), so split proportionally for per-ward view
        const monthBills = getBillsByMonth(period.year, period.month);
        const pendingBills = monthBills.filter(
          (b) => b.status === "pending" || b.status === "overdue"
        );
        const totalBillExpense = pendingBills.reduce(
          (sum, b) => sum + b.amount,
          0
        );

        let expenses: number;
        if (ward === "total") {
          expenses = totalBillExpense;
        } else {
          // Split bills proportionally by active patients per ward
          const totalActivePatients = patients.filter((p) => p.active).length;
          const wardActivePatients = patients.filter(
            (p) => p.active && p.ward === ward
          ).length;
          const ratio =
            totalActivePatients > 0
              ? wardActivePatients / totalActivePatients
              : 0.5;
          expenses = totalBillExpense * ratio;
        }

        return {
          grossIncome,
          expenses,
          net: grossIncome - expenses,
          invoiceCount,
        };
      });

      return {
        ward,
        label:
          ward === "feminina"
            ? "Ala Feminina"
            : ward === "masculina"
            ? "Ala Masculina"
            : "Total Geral",
        periods: periodData,
      };
    });
  }, [invoices, bills, patients, periods, patientWardMap, getBillsByMonth]);

  // Cumulative 3-month totals per ward
  const cumulativeData = useMemo(() => {
    return forecastData.map((row) => {
      const cumGross = row.periods.reduce((s, p) => s + p.grossIncome, 0);
      const cumExpenses = row.periods.reduce((s, p) => s + p.expenses, 0);
      return {
        ward: row.ward,
        label: row.label,
        grossIncome: cumGross,
        expenses: cumExpenses,
        net: cumGross - cumExpenses,
        invoiceCount: row.periods.reduce((s, p) => s + p.invoiceCount, 0),
      };
    });
  }, [forecastData]);

  const wardColors: Record<WardKey, string> = {
    feminina: "border-pink-400/40 bg-pink-50/30 dark:bg-pink-950/20",
    masculina: "border-blue-400/40 bg-blue-50/30 dark:bg-blue-950/20",
    total: "border-primary/40 bg-primary/5",
  };

  const wardBadgeColors: Record<WardKey, string> = {
    feminina:
      "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
    masculina:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    total: "bg-primary/10 text-primary",
  };

  return (
    <div className="space-y-6">
      {/* Per-month breakdown */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 pr-4 text-left font-semibold text-muted-foreground">
                Ala
              </th>
              {periods.map((p) => (
                <th
                  key={`${p.year}-${p.month}`}
                  className="px-3 py-3 text-center font-semibold capitalize"
                  colSpan={3}
                >
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {p.label}
                  </span>
                </th>
              ))}
              <th
                className="px-3 py-3 text-center font-semibold text-muted-foreground"
                colSpan={3}
              >
                Acumulado 3 meses
              </th>
            </tr>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="py-2 pr-4 text-left" />
              {periods.map((p) => (
                <>
                  <th
                    key={`${p.year}-${p.month}-in`}
                    className="px-2 py-2 text-right text-green-600 dark:text-green-400"
                  >
                    Entradas
                  </th>
                  <th
                    key={`${p.year}-${p.month}-out`}
                    className="px-2 py-2 text-right text-red-500 dark:text-red-400"
                  >
                    Saídas
                  </th>
                  <th
                    key={`${p.year}-${p.month}-net`}
                    className="px-2 py-2 text-right"
                  >
                    Líquido
                  </th>
                </>
              ))}
              <th className="px-2 py-2 text-right text-green-600 dark:text-green-400">
                Entradas
              </th>
              <th className="px-2 py-2 text-right text-red-500 dark:text-red-400">
                Saídas
              </th>
              <th className="px-2 py-2 text-right">Líquido</th>
            </tr>
          </thead>
          <tbody>
            {forecastData.map((row, rowIdx) => {
              const cumRow = cumulativeData[rowIdx];
              return (
                <tr
                  key={row.ward}
                  className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${
                    row.ward === "total" ? "font-semibold" : ""
                  }`}
                >
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        wardBadgeColors[row.ward]
                      }`}
                    >
                      {row.label}
                    </span>
                  </td>
                  {row.periods.map((period, pIdx) => (
                    <>
                      <td
                        key={`${row.ward}-${pIdx}-in`}
                        className="px-2 py-3 text-right text-green-700 dark:text-green-400"
                      >
                        {formatCurrency(period.grossIncome)}
                        {period.invoiceCount > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({period.invoiceCount})
                          </span>
                        )}
                      </td>
                      <td
                        key={`${row.ward}-${pIdx}-out`}
                        className="px-2 py-3 text-right text-red-600 dark:text-red-400"
                      >
                        {formatCurrency(period.expenses)}
                      </td>
                      <td
                        key={`${row.ward}-${pIdx}-net`}
                        className="px-2 py-3 text-right"
                      >
                        <span
                          className={`inline-flex items-center gap-0.5 font-medium ${
                            period.net > 0
                              ? "text-green-700 dark:text-green-400"
                              : period.net < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {period.net > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : period.net < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          {formatCurrency(period.net)}
                        </span>
                      </td>
                    </>
                  ))}
                  {/* Cumulative */}
                  <td className="px-2 py-3 text-right text-green-700 dark:text-green-400 border-l border-border/40">
                    {formatCurrency(cumRow.grossIncome)}
                  </td>
                  <td className="px-2 py-3 text-right text-red-600 dark:text-red-400">
                    {formatCurrency(cumRow.expenses)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold ${
                        cumRow.net > 0
                          ? "text-green-700 dark:text-green-400"
                          : cumRow.net < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {cumRow.net > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : cumRow.net < 0 ? (
                        <TrendingDown className="h-3.5 w-3.5" />
                      ) : (
                        <Minus className="h-3.5 w-3.5" />
                      )}
                      {formatCurrency(cumRow.net)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cumulativeData.map((row) => (
          <div
            key={row.ward}
            className={`rounded-xl border p-4 ${wardColors[row.ward]}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  wardBadgeColors[row.ward]
                }`}
              >
                {row.label}
              </span>
              <span className="text-xs text-muted-foreground">
                Próximos 3 meses
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  Entradas previstas
                </span>
                <span className="font-medium text-green-700 dark:text-green-400">
                  {formatCurrency(row.grossIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  Saídas previstas
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(row.expenses)}
                </span>
              </div>
              <div className="mt-2 border-t border-border/40 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Resultado líquido</span>
                <span
                  className={`text-base font-bold ${
                    row.net > 0
                      ? "text-green-700 dark:text-green-400"
                      : row.net < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(row.net)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        * Entradas baseadas em cobranças pendentes com vencimento nos próximos
        meses. Saídas baseadas em contas a pagar pendentes. Saídas por ala são
        distribuídas proporcionalmente ao número de pacientes ativos.
      </p>
    </div>
  );
}
