import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BillPaymentMethod, billPaymentMethodLabels } from "@/types/bill";
import { AlertTriangle, Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface PaymentLine {
  id: string;
  amount: string;
  paymentMethod: BillPaymentMethod;
  paymentDate: string;
  notes: string;
}

interface PayBillDialogProps {
  onConfirm: (
    lines: {
      amount: number;
      paymentMethod: BillPaymentMethod;
      paymentDate: Date;
      notes?: string;
    }[]
  ) => void;
  trigger: React.ReactNode;
  billAmount: number;
  billDueDate: string;
  /** Already-paid amount (from existing bill_payments) */
  alreadyPaid?: number;
}

const today = () => new Date().toISOString().split("T")[0];

const newLine = (): PaymentLine => ({
  id: crypto.randomUUID(),
  amount: "",
  paymentMethod: "pix",
  paymentDate: today(),
  notes: "",
});

export function PayBillDialog({
  onConfirm,
  trigger,
  billAmount,
  billDueDate,
  alreadyPaid = 0,
}: PayBillDialogProps) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<PaymentLine[]>([]);

  const remaining = billAmount - alreadyPaid;

  const totalEntered = lines.reduce(
    (sum, l) => sum + (parseFloat(l.amount) || 0),
    0
  );
  const balance = remaining - totalEntered;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Pre-fill first line with remaining balance
      setLines([
        { ...newLine(), amount: remaining > 0 ? String(remaining) : "" },
      ]);
    }
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);

  const removeLine = (id: string) =>
    setLines((prev) => prev.filter((l) => l.id !== id));

  const updateLine = (id: string, field: keyof PaymentLine, value: string) =>
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );

  const isLate = (dateStr: string) => {
    const due = new Date(billDueDate);
    const payment = new Date(dateStr + "T12:00:00");
    return payment > due;
  };

  const canConfirm =
    lines.length > 0 &&
    lines.every(
      (l) => parseFloat(l.amount) > 0 && l.paymentDate && l.paymentMethod
    );

  const handleConfirm = () => {
    const payload = lines.map((l) => ({
      amount: parseFloat(l.amount),
      paymentMethod: l.paymentMethod,
      paymentDate: new Date(l.paymentDate + "T12:00:00"),
      notes: l.notes.trim() || undefined,
    }));
    onConfirm(payload);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-card sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/50 p-3 text-center text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-semibold">{formatCurrency(billAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Já pago</p>
              <p className="font-semibold text-green-500">
                {formatCurrency(alreadyPaid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo restante</p>
              <p
                className={`font-bold ${
                  balance < 0
                    ? "text-destructive"
                    : balance === 0
                    ? "text-green-500"
                    : "text-yellow-500"
                }`}
              >
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          {/* Payment lines */}
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div
                key={line.id}
                className="rounded-lg border border-border bg-background p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Pagamento {idx + 1}
                  </span>
                  {lines.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeLine(line.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={line.amount}
                      onChange={(e) =>
                        updateLine(line.id, "amount", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Forma de Pagamento</Label>
                    <Select
                      value={line.paymentMethod}
                      onValueChange={(v) =>
                        updateLine(line.id, "paymentMethod", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {(
                          Object.keys(
                            billPaymentMethodLabels
                          ) as BillPaymentMethod[]
                        ).map((key) => (
                          <SelectItem key={key} value={key}>
                            {billPaymentMethodLabels[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Data do Pagamento</Label>
                  <Input
                    type="date"
                    value={line.paymentDate}
                    onChange={(e) =>
                      updateLine(line.id, "paymentDate", e.target.value)
                    }
                  />
                  {line.paymentDate && isLate(line.paymentDate) && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      Pagamento em atraso
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Observação (opcional)</Label>
                  <Textarea
                    placeholder="Detalhes sobre este pagamento..."
                    value={line.notes}
                    onChange={(e) =>
                      updateLine(line.id, "notes", e.target.value)
                    }
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add line button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={addLine}
          >
            <Plus className="h-4 w-4" />
            Adicionar outra forma de pagamento
          </Button>

          {/* Balance feedback */}
          {totalEntered > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Total neste registro:
                </span>
                <span className="font-semibold">
                  {formatCurrency(totalEntered)}
                </span>
              </div>
              {balance < 0 && (
                <p className="text-xs text-destructive">
                  ⚠️ O valor informado excede o saldo restante em{" "}
                  {formatCurrency(Math.abs(balance))}
                </p>
              )}
              {balance === 0 && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Conta será quitada integralmente
                </p>
              )}
              {balance > 0 && (
                <p className="text-xs text-yellow-500">
                  Restará {formatCurrency(balance)} após este pagamento
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="gap-2 bg-green-500 hover:bg-green-600"
          >
            <Check className="h-4 w-4" />
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
