import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MonthlyComparisonChartProps {
  selectedMonth: Date;
  getMonthlyData: (year: number, month: number) => { income: number; expense: number };
}

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value);
}

export function MonthlyComparisonChart({ selectedMonth, getMonthlyData }: MonthlyComparisonChartProps) {
  const data = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const currentMonth = selectedMonth.getMonth();

    // Show 6 months: 5 previous + current
    const months: { month: string; income: number; expense: number; isCurrent: boolean }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const { income, expense } = getMonthlyData(y, m);
      months.push({
        month: `${MONTH_LABELS[m]}/${String(y).slice(2)}`,
        income,
        expense,
        isCurrent: i === 0,
      });
    }
    return months;
  }, [selectedMonth, getMonthlyData]);

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground">
        Nenhum dado nos últimos 6 meses
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
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
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === 'income' ? 'Entradas' : 'Saídas',
          ]}
        />
        <Legend
          formatter={(value) => (value === 'income' ? 'Entradas' : 'Saídas')}
        />
        <Bar
          dataKey="income"
          name="income"
          fill="hsl(var(--chart-income))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="expense"
          fill="hsl(var(--chart-expense))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
