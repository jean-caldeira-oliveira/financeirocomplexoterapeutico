import { expenseCategoryLabels, ExpenseCategory } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface ExpenseBreakdownProps {
  expenseByCategory: Record<string, number>;
  totalExpense: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const categoryColors: Record<string, string> = {
  // CV - Custo Variado (tons de verde)
  cv_materiais: 'bg-emerald-500',
  cv_manutencao: 'bg-green-500',
  cv_marketing: 'bg-teal-500',
  cv_outros: 'bg-lime-500',
  // CF - Custo Fixo (tons de azul)
  cf_aluguel: 'bg-blue-500',
  cf_agua: 'bg-cyan-500',
  cf_energia: 'bg-sky-500',
  cf_internet_telefone: 'bg-indigo-500',
  cf_contabilidade: 'bg-slate-500',
  cf_outros: 'bg-blue-400',
  // IMP - Impostos (tons de laranja)
  imp_impostos: 'bg-amber-500',
  imp_taxas: 'bg-orange-500',
  // PROL - Pró-labore (tons de rosa/vermelho)
  prol_socios: 'bg-rose-500',
  prol_folha: 'bg-pink-500',
  // BC - Banco (tons de roxo)
  bc_tarifas: 'bg-violet-500',
  bc_juros: 'bg-purple-500',
  bc_emprestimos: 'bg-fuchsia-500',
};

export function ExpenseBreakdown({ expenseByCategory, totalExpense }: ExpenseBreakdownProps) {
  const sortedCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Nenhuma saída neste mês
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedCategories.map(([category, amount]) => {
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        const label = expenseCategoryLabels[category as ExpenseCategory] || category;
        const color = categoryColors[category] || 'bg-gray-500';

        return (
          <div key={category} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground">
                {formatCurrency(amount)} ({percentage.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", color)}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
