import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  variant?: 'default' | 'income' | 'expense' | 'balance';
}

export function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in",
      "bg-card border border-border shadow-sm",
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            variant === 'income' && "text-success",
            variant === 'expense' && "text-destructive",
            variant === 'balance' && "text-primary",
          )}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg",
          variant === 'income' && "bg-success/10 text-success",
          variant === 'expense' && "bg-destructive/10 text-destructive",
          variant === 'balance' && "bg-primary/10 text-primary",
          variant === 'default' && "bg-muted text-muted-foreground",
        )}>
          {icon}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className={cn(
        "absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10 blur-2xl",
        variant === 'income' && "bg-success",
        variant === 'expense' && "bg-destructive",
        variant === 'balance' && "bg-primary",
      )} />
    </div>
  );
}
