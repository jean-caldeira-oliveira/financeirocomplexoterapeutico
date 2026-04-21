import { useMemo } from 'react';
import { useBills } from '@/hooks/useBills';

interface BillsBreakdownProps {
  year: number;
  month: number;
}

export function BillsBreakdown({ year, month }: BillsBreakdownProps) {
  const { getBillsByMonth } = useBills();

  const monthBills = useMemo(() => getBillsByMonth(year, month), [getBillsByMonth, year, month]);

  const { total, count } = useMemo(() => {
    let totalAmount = 0;
    monthBills.forEach((bill) => {
      totalAmount += bill.amount;
    });
    return { total: totalAmount, count: monthBills.length };
  }, [monthBills]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (monthBills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma conta no mês</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Total */}
      <div className="rounded-lg bg-primary/10 p-3">
        <p className="text-xs text-muted-foreground">Total do Mês</p>
        <p className="text-xl font-bold text-primary">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground">{monthBills.length} contas</p>
      </div>
    </div>
  );
}
