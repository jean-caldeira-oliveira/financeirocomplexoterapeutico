import { Transaction, categoryLabels } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Trash2, Receipt, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface DisplayTransaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;
  date: string;
  source: 'manual' | 'invoice' | 'bill';
}

interface TransactionListProps {
  transactions: DisplayTransaction[];
  onDelete: (id: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

const sourceLabel: Record<string, { label: string; icon: React.ReactNode }> = {
  invoice: { label: 'Cobrança', icon: <Receipt className="h-3 w-3" /> },
  bill: { label: 'Conta', icon: <FileText className="h-3 w-3" /> },
};

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 rounded-full bg-muted p-3">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium">Nenhuma transação</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nenhum registro neste mês
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {transactions.map((transaction, index) => (
        <div
          key={transaction.id}
          className={cn(
            "group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-md",
            "animate-fade-in"
          )}
          style={{ animationDelay: `${index * 30}ms` }}
        >
          {/* Icon */}
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              transaction.type === 'income'
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {transaction.type === 'income' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium">{transaction.description}</p>
              {transaction.source !== 'manual' && (
                <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 shrink-0">
                  {sourceLabel[transaction.source]?.icon}
                  {sourceLabel[transaction.source]?.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryLabels[transaction.category] || transaction.category} • {formatDate(transaction.date)}
            </p>
          </div>

          {/* Amount */}
          <div className="text-right">
            <p
              className={cn(
                "font-semibold",
                transaction.type === 'income' ? "text-success" : "text-destructive"
              )}
            >
              {transaction.type === 'income' ? '+' : '-'}{' '}
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Delete Button - only for manual transactions */}
          {transaction.source === 'manual' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A transação será permanentemente removida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(transaction.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ))}
    </div>
  );
}
