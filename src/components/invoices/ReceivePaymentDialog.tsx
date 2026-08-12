import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AddInvoicePaymentData,
  InvoiceChargesBreakdown,
} from "@/hooks/useInvoices";
import { cn } from "@/lib/utils";
import {
  InvoicePaymentMethod,
  invoicePaymentMethodLabels,
} from "@/types/invoice";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";

interface ReceivePaymentDialogProps {
  invoiceAmount: number;
  paidAmount: number;
  /** @deprecated use chargesBreakdown instead */
  interestAmount?: number;
  chargesBreakdown?: InvoiceChargesBreakdown;
  onConfirm: (data: AddInvoicePaymentData) => void;
  trigger: React.ReactNode;
}

const fmt = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

export function ReceivePaymentDialog({
  invoiceAmount,
  paidAmount,
  interestAmount = 0,
  chargesBreakdown,
  onConfirm,
  trigger,
}: ReceivePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<InvoicePaymentMethod>("pix");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isLate, setIsLate] = useState(false);

  const remainingAmount = useMemo(
    () => Math.max(invoiceAmount - paidAmount, 0),
    [invoiceAmount, paidAmount]
  );

  // Prefer the detailed breakdown; fall back to legacy interestAmount
  const fine = chargesBreakdown?.fine ?? 0;
  const interest = chargesBreakdown?.interest ?? 0;
  const totalCharges = chargesBreakdown?.total ?? interestAmount;
  const daysLate = chargesBreakdown?.daysLate ?? 0;
  const totalWithCharges = remainingAmount + totalCharges;

  const handleOpen = () => {
    setAmount(
      totalWithCharges > 0 ? totalWithCharges.toFixed(2).replace(".", ",") : ""
    );
  };

  const handleConfirm = () => {
    const parsedAmount = Number(amount.replace(",", "."));
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    onConfirm({
      amount: parsedAmount,
      paymentDate,
      method,
      isLate,
    });

    setOpen(false);
    setAmount("");
    setMethod("pix");
    setPaymentDate(new Date());
    setIsLate(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={handleOpen}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar recebimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resumo financeiro */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor da cobrança</span>
              <strong>{fmt(invoiceAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Já recebido</span>
              <strong>{fmt(paidAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo restante</span>
              <strong>{fmt(remainingAmount)}</strong>
            </div>

            {totalCharges > 0 && (
              <>
                <div className="border-t border-border/60 pt-1.5 mt-1 space-y-1">
                  {fine > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Multa de mora (2%)
                      </span>
                      <strong className="text-amber-600 dark:text-amber-400">
                        {fmt(fine)}
                      </strong>
                    </div>
                  )}
                  {interest > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-red-500 font-medium">
                        Juros de mora
                        {daysLate > 0 && (
                          <span className="font-normal text-xs ml-1 text-muted-foreground">
                            (0,033%/dia × {daysLate} dia
                            {daysLate !== 1 ? "s" : ""})
                          </span>
                        )}
                      </span>
                      <strong className="text-red-500">{fmt(interest)}</strong>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center border-t border-border pt-1.5 mt-1">
                  <span className="font-semibold">Total com encargos</span>
                  <strong className="text-lg">{fmt(totalWithCharges)}</strong>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Valor recebido</Label>
            <Input
              id="payment-amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de recebimento</Label>
            <Select
              value={method}
              onValueChange={(value) =>
                setMethod(value as InvoicePaymentMethod)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(
                    invoicePaymentMethodLabels
                  ) as InvoicePaymentMethod[]
                ).map((paymentMethod) => (
                  <SelectItem key={paymentMethod} value={paymentMethod}>
                    {invoicePaymentMethodLabels[paymentMethod]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data do recebimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {paymentDate ? (
                    format(paymentDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is-late"
              checked={isLate}
              onCheckedChange={(checked) => setIsLate(Boolean(checked))}
            />
            <Label htmlFor="is-late" className="font-normal">
              Marcar recebimento em atraso (manual)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            Confirmar recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
