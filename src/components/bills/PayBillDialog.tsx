import { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BillPaymentMethod, billPaymentMethodLabels } from '@/types/bill';

interface PayBillDialogProps {
  onConfirm: (paymentDate: Date, paidAmount: number, paymentMethod: BillPaymentMethod) => void;
  trigger: React.ReactNode;
  billAmount: number;
  billDueDate: string;
}

export function PayBillDialog({ onConfirm, trigger, billAmount, billDueDate }: PayBillDialogProps) {
  const [open, setOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState(String(billAmount));
  const [paymentMethod, setPaymentMethod] = useState<BillPaymentMethod>('pix');

  const isLatePayment = () => {
    const due = new Date(billDueDate);
    const payment = new Date(paymentDate + 'T12:00:00');
    return payment > due;
  };

  const handleConfirm = () => {
    onConfirm(new Date(paymentDate + 'T12:00:00'), parseFloat(paidAmount), paymentMethod);
    setOpen(false);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaidAmount(String(billAmount));
    setPaymentMethod('pix');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPaidAmount(String(billAmount));
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('pix');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const diff = parseFloat(paidAmount || '0') - billAmount;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Valor previsto</p>
            <p className="text-lg font-bold">{formatCurrency(billAmount)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAmount">Valor Pago</Label>
            <Input
              id="paidAmount"
              type="number"
              step="0.01"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
            {diff !== 0 && paidAmount && (
              <p className={`text-xs ${diff > 0 ? 'text-destructive' : 'text-green-500'}`}>
                {diff > 0 ? `+${formatCurrency(diff)} acima do previsto` : `${formatCurrency(Math.abs(diff))} abaixo do previsto`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as BillPaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {(Object.keys(billPaymentMethodLabels) as BillPaymentMethod[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {billPaymentMethodLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Data do Pagamento</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
            {isLatePayment() && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Pagamento em atraso
              </Badge>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2 bg-green-500 hover:bg-green-600">
            <Check className="h-4 w-4" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
