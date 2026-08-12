import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Invoice } from "@/types/invoice";
import { Patient } from "@/types/transaction";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, CheckCircle2, Clock, Minus, Plus } from "lucide-react";
import { useState } from "react";

interface ExtendContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  invoices: Invoice[];
  onExtend: (additionalMonths: number) => Promise<void>;
}

export default function ExtendContractDialog({
  open,
  onOpenChange,
  patient,
  invoices,
  onExtend,
}: ExtendContractDialogProps) {
  const [additionalMonths, setAdditionalMonths] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Find the last due date from monthly invoices
  const monthlyInvoices = invoices.filter((inv) => inv.type === "monthly");
  const lastMonthlyInvoice =
    monthlyInvoices.length > 0
      ? monthlyInvoices.reduce((prev, curr) =>
          curr.installmentNumber > prev.installmentNumber ? curr : prev
        )
      : null;

  const lastDueDate: Date = lastMonthlyInvoice
    ? new Date(lastMonthlyInvoice.dueDate)
    : patient.firstInstallmentDate
    ? new Date(patient.firstInstallmentDate)
    : new Date();

  const newTotal = patient.installments + additionalMonths;
  const newEndDate = addMonths(lastDueDate, additionalMonths);

  const formatDate = (date: Date) =>
    format(date, "dd/MM/yyyy", { locale: ptBR });

  const handleDecrement = () => {
    setAdditionalMonths((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setAdditionalMonths((prev) => Math.min(24, prev + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setAdditionalMonths(Math.min(24, Math.max(1, val)));
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onExtend(additionalMonths);
      onOpenChange(false);
      setAdditionalMonths(1);
    } finally {
      setIsLoading(false);
    }
  };

  const originalInstallments =
    patient.originalInstallments ?? patient.installments;
  const totalExtensionMonths =
    (patient.extensionMonths ?? 0) + additionalMonths;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-blue-600" />
            Estender Contrato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current situation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Situação Atual
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Paciente</p>
                <p className="font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parcelas originais</p>
                <p className="font-medium">{originalInstallments} meses</p>
              </div>
              {(patient.extensionMonths ?? 0) > 0 && (
                <div>
                  <p className="text-muted-foreground">Extensões anteriores</p>
                  <p className="font-medium">
                    <Badge variant="secondary" className="text-xs">
                      +{patient.extensionMonths} meses
                    </Badge>
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Total atual</p>
                <p className="font-medium">{patient.installments} meses</p>
              </div>
              <div>
                <p className="text-muted-foreground">Último vencimento</p>
                <p className="font-medium">{formatDate(lastDueDate)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Extension input */}
          <div className="space-y-2">
            <Label htmlFor="additional-months">Meses adicionais</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleDecrement}
                disabled={additionalMonths <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="additional-months"
                type="number"
                min={1}
                max={24}
                value={additionalMonths}
                onChange={handleInputChange}
                className="text-center w-20"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleIncrement}
                disabled={additionalMonths >= 24}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {additionalMonths === 1 ? "mês" : "meses"}
              </span>
            </div>
          </div>

          {/* Extension summary card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-blue-900">
              Resumo da Extensão
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-blue-800">
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                <span>
                  <span className="font-medium">{originalInstallments}</span>{" "}
                  meses originais
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <Plus className="h-4 w-4 text-blue-500 shrink-0" />
                <span>
                  <span className="font-medium">{totalExtensionMonths}</span>{" "}
                  meses adicionais (total após esta extensão)
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                <span>
                  Total: <span className="font-semibold">{newTotal} meses</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <CalendarPlus className="h-4 w-4 text-blue-500 shrink-0" />
                <span>
                  Novo término:{" "}
                  <span className="font-semibold">
                    {formatDate(newEndDate)}
                  </span>
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-700">
                Parcelas{" "}
                <span className="font-medium">{patient.installments + 1}</span>{" "}
                a <span className="font-medium">{newTotal}</span> serão geradas
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processando...
              </>
            ) : (
              <>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Confirmar Extensão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
