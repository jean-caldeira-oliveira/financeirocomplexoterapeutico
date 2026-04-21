import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
  selectedMonth: Date;
  onChange: (date: Date) => void;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthSelector({ selectedMonth, onChange }: MonthSelectorProps) {
  const handlePrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onChange(newDate);
  };

  const handleCurrentMonth = () => {
    onChange(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth.getFullYear() === now.getFullYear() && 
           selectedMonth.getMonth() === now.getMonth();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex min-w-[180px] items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">
          {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth() && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCurrentMonth}
          className="ml-2 text-xs"
        >
          Mês Atual
        </Button>
      )}
    </div>
  );
}
