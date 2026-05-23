import { useMemo } from "react";
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

interface IncomeExpenseComparisonChartProps {
  title: string;
  expectedValue: number;
  actualValue: number;
  selectedMonth: Date;
  type: "income" | "expense"; // To differentiate colors and labels
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

export function IncomeExpenseComparisonChart({
  title,
  expectedValue,
  actualValue,
  selectedMonth,
  type,
}: IncomeExpenseComparisonChartProps) {
  const data = useMemo(() => {
    const monthLabel = new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "2-digit",
    }).format(selectedMonth);
    return [
      {
        name: monthLabel,
        expected: expectedValue,
        actual: actualValue,
      },
    ];
  }, [expectedValue, actualValue, selectedMonth]);

  const hasData = expectedValue > 0 || actualValue > 0;

  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground">
        Nenhum dado para o mês selecionado
      </div>
    );
  }

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
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
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
  );
}
