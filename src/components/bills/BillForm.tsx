import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AddBillData } from '@/hooks/useBills';
import { BillRecurrence, billRecurrenceLabels } from '@/types/bill';
import { useCustomCategories } from '@/hooks/useCustomCategories';

interface BillFormProps {
  onSubmit: (data: AddBillData) => void;
}

export function BillForm({ onSubmit }: BillFormProps) {
  const { allGroupLabels, allSubcategoryLabels, allGroupSubcategories } = useCustomCategories();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryGroup, setCategoryGroup] = useState<string>(Object.keys(allGroupLabels)[0] || '');
  const [category, setCategory] = useState<string>('');
  const [recurrence, setRecurrence] = useState<BillRecurrence>('none');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');

  const currentSubs = allGroupSubcategories[categoryGroup] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !dueDate) return;

    onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      dueDate: new Date(dueDate + 'T12:00:00'),
      category: categoryGroup,
      subcategory: category,
      recurrence: isInstallment ? 'none' : recurrence,
      installments: isInstallment ? parseInt(installments) : undefined,
    });

    setDescription('');
    setAmount('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setCategoryGroup(Object.keys(allGroupLabels)[0] || '');
    setCategory('');
    setRecurrence('none');
    setIsInstallment(false);
    setInstallments('2');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Conta a Pagar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Conta de luz, Aluguel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor da Parcela</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">1º Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="installment-toggle">Compra Parcelada</Label>
              <p className="text-xs text-muted-foreground">Dividir em várias parcelas mensais</p>
            </div>
            <Switch
              id="installment-toggle"
              checked={isInstallment}
              onCheckedChange={(checked) => {
                setIsInstallment(checked);
                if (checked) setRecurrence('none');
              }}
            />
          </div>

          {isInstallment && (
            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Input
                id="installments"
                type="number"
                min="2"
                max="48"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
              {amount && installments && (
                <p className="text-sm text-muted-foreground">
                  Total: R$ {(parseFloat(amount) * parseInt(installments)).toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          )}

          {!isInstallment && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Recorrência
              </Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as BillRecurrence)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {(Object.keys(billRecurrenceLabels) as BillRecurrence[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {billRecurrenceLabels[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryGroup} onValueChange={(v) => { setCategoryGroup(v); setCategory(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {Object.entries(allGroupLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {currentSubs.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {allSubcategoryLabels[cat] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {isInstallment ? `Cadastrar ${installments}x Parcelas` : 'Cadastrar Conta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
