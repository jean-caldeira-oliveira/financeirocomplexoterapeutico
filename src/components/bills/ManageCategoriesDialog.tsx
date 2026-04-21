import { useState } from 'react';
import { Plus, Trash2, Tags } from 'lucide-react';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCustomCategories } from '@/hooks/useCustomCategories';

export function ManageCategoriesDialog() {
  const {
    customData,
    addGroup,
    addSubcategory,
    removeGroup,
    removeSubcategory,
    allGroupLabels,
    allGroupSubcategories,
    allSubcategoryLabels,
  } = useCustomCategories();

  const [open, setOpen] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [newSubLabel, setNewSubLabel] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const handleAddGroup = async () => {
    if (!newGroupLabel.trim()) return;
    const key = await addGroup(newGroupLabel.trim());
    setSelectedGroup(key);
    setNewGroupLabel('');
  };

  const handleAddSubcategory = () => {
    if (!newSubLabel.trim() || !selectedGroup) return;
    addSubcategory(selectedGroup, newSubLabel.trim());
    setNewSubLabel('');
  };

  const isCustomGroup = (key: string) => customData.groups.some((g) => g.key === key);
  const isCustomSub = (key: string) => customData.subcategories.some((s) => s.key === key);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tags className="h-4 w-4" />
          Gerenciar Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias e Subcategorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Add new category group */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Nova Categoria</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Alimentação, Transporte..."
                value={newGroupLabel}
                onChange={(e) => setNewGroupLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
              />
              <Button onClick={handleAddGroup} size="sm" className="gap-1 shrink-0">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Add new subcategory */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Nova Subcategoria</Label>
            <div className="space-y-2">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {Object.entries(allGroupLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da subcategoria..."
                  value={newSubLabel}
                  onChange={(e) => setNewSubLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory()}
                  disabled={!selectedGroup}
                />
                <Button onClick={handleAddSubcategory} size="sm" className="gap-1 shrink-0" disabled={!selectedGroup}>
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* List all categories and subcategories */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Categorias Existentes</Label>
            <div className="space-y-4">
              {Object.entries(allGroupLabels).map(([groupKey, groupLabel]) => {
                const subs = allGroupSubcategories[groupKey] || [];
                return (
                  <div key={groupKey} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{groupLabel}</span>
                      {isCustomGroup(groupKey) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive hover:text-destructive"
                          onClick={() => removeGroup(groupKey)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {subs.map((subKey) => (
                        <Badge
                          key={subKey}
                          variant="secondary"
                          className="gap-1 text-xs"
                        >
                          {allSubcategoryLabels[subKey] || subKey}
                          {isCustomSub(subKey) && (
                            <button
                              onClick={() => removeSubcategory(subKey)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                      {subs.length === 0 && (
                        <span className="text-xs text-muted-foreground">Nenhuma subcategoria</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
