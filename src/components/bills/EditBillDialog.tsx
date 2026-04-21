import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Bill } from '@/types/bill';
import { useCustomCategories } from '@/hooks/useCustomCategories';

interface EditBillDialogProps {
  bill: Bill;
  onSave: (id: string, data: { description?: string; amount?: number; dueDate?: Date; category?: string; subcategory?: string }) => void;
}

export function EditBillDialog({ bill, onSave }: EditBillDialogProps) {
  const { allGroupLabels, allSubcategoryLabels, allGroupSubcategories } = useCustomCategories();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(bill.description);
  const [amount, setAmount] = useState(String(bill.amount));
  const [dueDate, setDueDate] = useState(new Date(bill.dueDate).toISOString().split('T')[0]);
  const [categoryGroup, setCategoryGroup] = useState<string>(bill.category);
  const [subcategory, setSubcategory] = useState<string>(bill.subcategory);

  const currentSubs = allGroupSubcategories[categoryGroup] || [];

  useEffect(() => {
    if (open) {
      setDescription(bill.description);
      setAmount(String(bill.amount));
      setDueDate(new Date(bill.dueDate).toISOString().split('T')[0]);
      setCategoryGroup(bill.category);
      setSubcategory(bill.subcategory);
    }
  }, [open, bill]);

  const handleSave = () => {
    onSave(bill.id, {
      description: description.trim(),
      amount: parseFloat(amount),
      dueDate: new Date(dueDate + 'T12:00:00'),
      category: categoryGroup,
      subcategory,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryGroup} onValueChange={(v) => { setCategoryGroup(v); setSubcategory(''); }}>
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
              <Select value={subcategory} onValueChange={setSubcategory}>
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

          {bill.installmentNumber && bill.totalInstallments && (
            <p className="text-sm text-muted-foreground">
              Parcela {bill.installmentNumber}/{bill.totalInstallments}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
