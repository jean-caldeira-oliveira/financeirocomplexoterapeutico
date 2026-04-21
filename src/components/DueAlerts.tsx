import { useMemo } from 'react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { AlertTriangle, Clock, Receipt, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInvoices } from '@/hooks/useInvoices';
import { useBills } from '@/hooks/useBills';

interface DueItem {
  id: string;
  type: 'invoice' | 'bill';
  description: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  isOverdue: boolean;
}

export function DueAlerts() {
  const { invoices } = useInvoices();
  const { bills } = useBills();

  const dueItems = useMemo(() => {
    const today = startOfDay(new Date());
    const items: DueItem[] = [];

    // Add invoices
    invoices
      .filter((inv) => inv.status !== 'paid')
      .forEach((inv) => {
        const dueDate = startOfDay(new Date(inv.dueDate));
        const daysUntilDue = differenceInDays(dueDate, today);
        
        // Include overdue and upcoming (next 7 days)
        if (daysUntilDue <= 7) {
          items.push({
            id: inv.id,
            type: 'invoice',
            description: `${inv.patientName} - Parcela ${inv.installmentNumber}/${inv.totalInstallments}`,
            amount: inv.amount,
            dueDate,
            daysUntilDue,
            isOverdue: daysUntilDue < 0,
          });
        }
      });

    // Add bills
    bills
      .filter((bill) => bill.status !== 'paid')
      .forEach((bill) => {
        const dueDate = startOfDay(new Date(bill.dueDate));
        const daysUntilDue = differenceInDays(dueDate, today);
        
        if (daysUntilDue <= 7) {
          items.push({
            id: bill.id,
            type: 'bill',
            description: bill.description,
            amount: bill.amount,
            dueDate,
            daysUntilDue,
            isOverdue: daysUntilDue < 0,
          });
        }
      });

    // Sort by due date (overdue first, then by days until due)
    return items.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [invoices, bills]);

  const overdueItems = dueItems.filter((item) => item.isOverdue);
  const upcomingItems = dueItems.filter((item) => !item.isOverdue);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getDaysLabel = (days: number) => {
    if (days < 0) {
      const absDays = Math.abs(days);
      return `${absDays} dia${absDays > 1 ? 's' : ''} atrasado`;
    }
    if (days === 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    return `Vence em ${days} dias`;
  };

  if (dueItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhum vencimento próximo</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[280px] pr-4">
      <div className="space-y-4">
        {/* Overdue Section */}
        {overdueItems.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Atrasados ({overdueItems.length})
              </span>
            </div>
            <div className="space-y-2">
              {overdueItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20"
                >
                  <div className="mt-0.5">
                    {item.type === 'invoice' ? (
                      <Receipt className="h-4 w-4 text-red-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {getDaysLabel(item.daysUntilDue)}
                      </span>
                      <Badge variant="outline" className="text-xs border-red-300 text-red-600">
                        {item.type === 'invoice' ? 'Mensalidade' : 'Conta'}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Section */}
        {upcomingItems.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Próximos vencimentos ({upcomingItems.length})
              </span>
            </div>
            <div className="space-y-2">
              {upcomingItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-900/20"
                >
                  <div className="mt-0.5">
                    {item.type === 'invoice' ? (
                      <Receipt className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-yellow-700 dark:text-yellow-400">
                        {getDaysLabel(item.daysUntilDue)} • {format(item.dueDate, 'dd/MM')}
                      </span>
                      <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                        {item.type === 'invoice' ? 'Mensalidade' : 'Conta'}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
