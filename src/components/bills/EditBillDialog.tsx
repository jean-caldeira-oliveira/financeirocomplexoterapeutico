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
import { Textarea } from "@/components/ui/textarea";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { Bill } from "@/types/bill";
import { MessageSquare, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

interface EditBillDialogProps {
  bill: Bill;
  onSave: (
    id: string,
    data: {
      description?: string;
      amount?: number;
      dueDate?: Date;
      category?: string;
      subcategory?: string;
      notes?: string;
    }
  ) => void;
}

export function EditBillDialog({ bill, onSave }: EditBillDialogProps) {
  const { allGroupLabels, allSubcategoryLabels, allGroupSubcategories } =
    useCustomCategories();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(bill.description);
  const [amount, setAmount] = useState(String(bill.amount));
  const [dueDate, setDueDate] = useState(
    new Date(bill.dueDate).toISOString().split("T")[0]
  );
  const [categoryGroup, setCategoryGroup] = useState<string>(bill.category);
  const [subcategory, setSubcategory] = useState<string>(bill.subcategory);
  const [notes, setNotes] = useState(bill.notes ?? "");

  const currentSubs = allGroupSubcategories[categoryGroup] || [];

  useEffect(() => {
    if (open) {
      setDescription(bill.description);
      setAmount(String(bill.amount));
      setDueDate(new Date(bill.dueDate).toISOString().split("T")[0]);
      setCategoryGroup(bill.category);
      setSubcategory(bill.subcategory);
      setNotes(bill.notes ?? "");
    }
  }, [open, bill]);

  const handleSave = () => {
    onSave(bill.id, {
      description: description.trim(),
      amount: parseFloat(amount),
      dueDate: new Date(dueDate + "T12:00:00"),
      category: categoryGroup,
      subcategory,
      notes: notes.trim() || undefined,
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
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={categoryGroup}
                onValueChange={(v) => {
                  setCategoryGroup(v);
                  setSubcategory("");
                }}
              >
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

          <div className="space-y-2">
            <Label htmlFor="edit-notes" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Observações
            </Label>
            <Textarea
              id="edit-notes"
              placeholder="Informações adicionais sobre esta conta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {bill.paymentNotes && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Observação do Pagamento
              </p>
              <p className="text-sm whitespace-pre-wrap">{bill.paymentNotes}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
