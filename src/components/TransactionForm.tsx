import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, TrendingDown } from 'lucide-react';
import {
  TransactionCategory,
  ExpenseCategory,
  ExpenseCategoryGroup,
  expenseCategoryLabels,
  expenseCategoryGroups,
  expenseCategoryGroupLabels,
} from '@/types/transaction';

interface TransactionFormProps {
  onSubmit: (data: {
    type: 'expense';
    category: TransactionCategory;
    description: string;
    amount: number;
    date: string;
  }) => void;
  defaultDate?: string;
}

export function TransactionForm({ onSubmit, defaultDate }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [categoryGroup, setCategoryGroup] = useState<ExpenseCategoryGroup>('custos_fixos');
  const [category, setCategory] = useState<ExpenseCategory>('cf_aluguel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);

  // Get all subcategories from all groups
  const allSubcategories = Object.values(expenseCategoryGroups).flat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      type: 'expense',
      category,
      description,
      amount: parsedAmount,
      date,
    });

    // Reset form
    setCategoryGroup('custos_fixos');
    setCategory('cf_aluguel');
    setDescription('');
    setAmount('');
    setDate(defaultDate || new Date().toISOString().split('T')[0]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-lg">
          <Plus className="h-5 w-5" />
          Nova Saída
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Saída</DialogTitle>
          <DialogDescription>
            Registre uma nova despesa ou pagamento
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Indicator */}
          <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
            <TrendingDown className="h-5 w-5" />
            <span className="font-medium">Saída</span>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold"
              required
            />
          </div>

          {/* Category Group */}
          <div className="space-y-2">
            <Label htmlFor="categoryGroup">Categoria</Label>
            <Select value={categoryGroup} onValueChange={(v) => setCategoryGroup(v as ExpenseCategoryGroup)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {(Object.keys(expenseCategoryGroups) as ExpenseCategoryGroup[]).map((group) => (
                  <SelectItem key={group} value={group}>
                    {expenseCategoryGroupLabels[group]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <Label htmlFor="category">Subcategoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {allSubcategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {expenseCategoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              type="text"
              placeholder="Ex: Pagamento equipe Janeiro"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Registrar Saída
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
