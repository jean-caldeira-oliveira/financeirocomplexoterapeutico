import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Employee } from "@/types/employee";

interface TerminateEmployeeDialogProps {
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (terminationDate: Date) => void;
}

export function TerminateEmployeeDialog({
  employee,
  onOpenChange,
  onConfirm,
}: TerminateEmployeeDialogProps) {
  const [terminationDate, setTerminationDate] = useState<Date>(new Date());

  return (
    <Dialog open={!!employee} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar desligamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Confirmar o desligamento de <strong>{employee?.fullName}</strong>? O status passará
            para "Desligado" e o cadastro sairá das listas de novos lançamentos, mas permanece
            disponível para consulta e relatórios.
          </p>

          <div className="space-y-2">
            <Label>Data de Desligamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(terminationDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={terminationDate}
                  onSelect={(date) => date && setTerminationDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => onConfirm(terminationDate)}
          >
            Confirmar Desligamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
