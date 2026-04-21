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

interface ChartData {
  week: string;
  income: number;
  expense: number;
}

interface CashFlowChartProps {
  data: ChartData[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value);
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground">
        Nenhuma transação neste mês
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `R$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
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
