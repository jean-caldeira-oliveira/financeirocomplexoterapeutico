import {
  DateRange,
  DateRangeSelector,
  PeriodPreset,
  getPresetRange,
} from "@/components/DateRangeSelector";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartDataPoint = {
  label: string;
  expected: number;
  actual: number;
};

interface IncomeExpenseComparisonChartProps {
  type: "income" | "expense";
  /** Called whenever the user changes the period/date range.
   *  The parent computes the data array and passes it back via `data`. */
  onDateRangeChange: (range: DateRange) => void;
  data: ChartDataPoint[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

export function IncomeExpenseComparisonChart({
  type,
  onDateRangeChange,
  data,
}: IncomeExpenseComparisonChartProps) {
  const [preset, setPreset] = useState<PeriodPreset>("month");
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetRange("month", new Date())
  );

  const handlePresetChange = (p: PeriodPreset, range: DateRange) => {
    setPreset(p);
    setDateRange(range);
    onDateRangeChange(range);
  };

  const hasData = useMemo(
    () => data.some((d) => d.expected > 0 || d.actual > 0),
    [data]
  );

  const expectedLabel = "Previstas";
  const actualLabel = "Realizadas";

  const expectedColor =
    type === "income"
      ? "hsl(var(--chart-income-expected))"
      : "hsl(var(--chart-expense-expected))";
  const actualColor =
    type === "income"
      ? "hsl(var(--chart-income))"
      : "hsl(var(--chart-expense))";

  return (
    <div className="space-y-3">
      {/* Period selector */}
      <DateRangeSelector
        preset={preset}
        dateRange={dateRange}
        onPresetChange={handlePresetChange}
      />

      {!hasData ? (
        <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">
          Nenhum dado para o período selecionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) =>
                `R$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
              }
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "expected" ? expectedLabel : actualLabel,
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "expected" ? expectedLabel : actualLabel
              }
            />
            <Bar
              dataKey="expected"
              name="expected"
              fill={expectedColor}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="actual"
              name="actual"
              fill={actualColor}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
