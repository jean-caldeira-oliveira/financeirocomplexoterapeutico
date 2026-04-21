import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { InvoicePaymentMethod, invoicePaymentMethodLabels } from '@/types/invoice';
import type { AddInvoicePaymentData } from '@/hooks/useInvoices';

interface ReceivePaymentDialogProps {
  invoiceAmount: number;
  paidAmount: number;
  interestAmount?: number;
  onConfirm: (data: AddInvoicePaymentData) => void;
  trigger: React.ReactNode;
}

export function ReceivePaymentDialog({ invoiceAmount, paidAmount, interestAmount = 0, onConfirm, trigger }: ReceivePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<InvoicePaymentMethod>('pix');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isLate, setIsLate] = useState(false);

  const remainingAmount = useMemo(() => Math.max(invoiceAmount - paidAmount, 0), [invoiceAmount, paidAmount]);
  const totalWithInterest = useMemo(() => remainingAmount + interestAmount, [remainingAmount, interestAmount]);

  const handleConfirm = () => {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    onConfirm({
      amount: parsedAmount,
      paymentDate,
      method,
      isLate,
    });

    setOpen(false);
    setAmount('');
    setMethod('pix');
    setPaymentDate(new Date());
    setIsLate(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => {
        const total = Math.max(invoiceAmount - paidAmount, 0) + interestAmount;
        setAmount(total > 0 ? total.toFixed(2).replace('.', ',') : '');
      }}>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar recebimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
            <p>Valor da cobrança: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceAmount)}</strong></p>
            <p>Já recebido: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidAmount)}</strong></p>
            <p>Saldo restante: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingAmount)}</strong></p>
            {interestAmount > 0 && (
              <p className="text-red-500">Juros por atraso: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(interestAmount)}</strong></p>
            )}
            {interestAmount > 0 && (
              <p className="font-semibold border-t border-border pt-1 mt-1">Total com juros: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingAmount + interestAmount)}</strong></p>
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
            <Select value={method} onValueChange={(value) => setMethod(value as InvoicePaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(invoicePaymentMethodLabels) as InvoicePaymentMethod[]).map((paymentMethod) => (
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
                  className={cn('w-full justify-start text-left font-normal', !paymentDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {paymentDate ? format(paymentDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="is-late" checked={isLate} onCheckedChange={(checked) => setIsLate(Boolean(checked))} />
            <Label htmlFor="is-late" className="font-normal">Marcar recebimento em atraso (manual)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Check className="h-4 w-4" />
            Salvar recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
