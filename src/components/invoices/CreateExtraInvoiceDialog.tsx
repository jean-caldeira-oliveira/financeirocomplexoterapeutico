import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { InvoiceType, InvoiceBillingMethod, extraInvoiceTypes, invoiceTypeLabels, billingMethodLabels } from '@/types/invoice';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
}

export interface CreateExtraInvoiceData {
  patientId: string;
  patientName: string;
  amount: number;
  dueDate: Date;
  type: InvoiceType;
  description?: string;
  installments: number;
  billingMethod: InvoiceBillingMethod;
  interestRateMonthly: number;
  fineRate: number;
  gracePeriodDays: number;
}

interface CreateExtraInvoiceDialogProps {
  patients: Patient[];
  onSubmit: (data: CreateExtraInvoiceData) => Promise<void>;
}

export function CreateExtraInvoiceDialog({ patients, onSubmit }: CreateExtraInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState<InvoiceType>('contract_break');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [installments, setInstallments] = useState('1');
  const [billingMethod, setBillingMethod] = useState<InvoiceBillingMethod>('');
  const [interestRate, setInterestRate] = useState('2');
  const [fineRate, setFineRate] = useState('2');
  const [gracePeriodDays, setGracePeriodDays] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPatient = patients.find((p) => p.id === patientId);

  const resetForm = () => {
    setPatientId('');
    setAmount('');
    setDescription('');
    setDueDate(new Date());
    setInstallments('1');
    setBillingMethod('');
    setInterestRate('2');
    setFineRate('2');
    setGracePeriodDays('0');
    setType('contract_break');
  };

  const handleSubmit = async () => {
    if (!patientId || !amount || !selectedPatient) return;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    const parsedInstallments = parseInt(installments) || 1;

    setIsSubmitting(true);
    try {
      await onSubmit({
        patientId,
        patientName: selectedPatient.name,
        amount: parsedAmount,
        dueDate,
        type,
        description: description.trim() || undefined,
        installments: parsedInstallments,
        billingMethod,
        interestRateMonthly: parseFloat(interestRate) || 0,
        fineRate: parseFloat(fineRate) || 0,
        gracePeriodDays: parseInt(gracePeriodDays) || 0,
      });
      setOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const billingMethods = Object.entries(billingMethodLabels).filter(([k]) => k !== '') as [InvoiceBillingMethod, string][];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Cobrança Avulsa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Cobrança Avulsa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={(v) => setType(v as InvoiceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {extraInvoiceTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {invoiceTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Total (R$) *</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Input
                type="number"
                min="1"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de Cobrança</Label>
            <Select value={billingMethod} onValueChange={(v) => setBillingMethod(v as InvoiceBillingMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                {billingMethods.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento (1ª parcela) *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dueDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => d && setDueDate(d)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Juros, Multa e Carência */}
          <div className="rounded-lg border p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Juros e Multa por Atraso</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Juros (%/mês)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Multa (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={fineRate}
                  onChange={(e) => setFineRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Carência (dias)</Label>
                <Input
                  type="number"
                  min="0"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Juros pro-rata por dia e multa fixa aplicados após o período de carência.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea
              placeholder="Descreva o motivo da cobrança..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!patientId || !amount || isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Criar Cobrança'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
