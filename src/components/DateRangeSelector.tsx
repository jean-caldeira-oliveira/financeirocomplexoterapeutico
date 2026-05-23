import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

export type PeriodPreset = "today" | "week" | "month" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export function getPresetRange(
  preset: PeriodPreset,
  referenceDate: Date
): DateRange {
  const today = startOfDay(referenceDate);
  switch (preset) {
    case "today":
      return { from: today, to: endOfDay(today) };
    case "week":
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(today, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        from: startOfMonth(today),
        to: endOfMonth(today),
      };
    default:
      return { from: today, to: endOfDay(today) };
  }
}

interface DateRangeSelectorProps {
  preset: PeriodPreset;
  dateRange: DateRange;
  onPresetChange: (preset: PeriodPreset, range: DateRange) => void;
}

export function DateRangeSelector({
  preset,
  dateRange,
  onPresetChange,
}: DateRangeSelectorProps) {
  const [customFrom, setCustomFrom] = useState<Date | undefined>(
    dateRange.from
  );
  const [customTo, setCustomTo] = useState<Date | undefined>(dateRange.to);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const handlePreset = (p: PeriodPreset) => {
    if (p === "custom") {
      const from = customFrom ?? startOfDay(new Date());
      const to = customTo ?? endOfDay(new Date());
      onPresetChange("custom", { from, to });
    } else {
      onPresetChange(p, getPresetRange(p, new Date()));
    }
  };

  const handleCustomFrom = (date: Date | undefined) => {
    if (!date) return;
    setCustomFrom(date);
    setFromOpen(false);
    const to = customTo ?? endOfDay(date);
    onPresetChange("custom", { from: startOfDay(date), to });
  };

  const handleCustomTo = (date: Date | undefined) => {
    if (!date) return;
    setCustomTo(date);
    setToOpen(false);
    const from = customFrom ?? startOfDay(date);
    onPresetChange("custom", { from, to: endOfDay(date) });
  };

  const presets: { key: PeriodPreset; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mês" },
    { key: "custom", label: "Personalizado" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button
          key={p.key}
          variant={preset === p.key ? "default" : "outline"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => handlePreset(p.key)}
        >
          {p.label}
        </Button>
      ))}

      {preset === "custom" && (
        <div className="flex items-center gap-1">
          {/* From date */}
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs gap-1",
                  !customFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                {customFrom
                  ? format(customFrom, "dd/MM/yyyy", { locale: ptBR })
                  : "De"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={handleCustomFrom}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-xs text-muted-foreground">→</span>

          {/* To date */}
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs gap-1",
                  !customTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                {customTo
                  ? format(customTo, "dd/MM/yyyy", { locale: ptBR })
                  : "Até"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={handleCustomTo}
                locale={ptBR}
                disabled={customFrom ? { before: customFrom } : undefined}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
