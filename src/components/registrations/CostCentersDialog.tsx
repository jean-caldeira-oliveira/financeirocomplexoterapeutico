import { useState } from "react";
import { Check, Pencil, Plus, Power, PowerOff, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CostCenter } from "@/types/costCenter";

interface CostCentersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenters: CostCenter[];
  onAdd: (name: string) => Promise<CostCenter | null>;
  onUpdate: (id: string, updates: Partial<Pick<CostCenter, "name" | "status">>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function CostCentersDialog({
  open,
  onOpenChange,
  costCenters,
  onAdd,
  onUpdate,
  onDelete,
}: CostCentersDialogProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const result = await onAdd(newName);
    if (result) setNewName("");
  };

  const handleStartEdit = (cc: CostCenter) => {
    setEditingId(cc.id);
    setEditingName(cc.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const success = await onUpdate(editingId, { name: editingName });
    if (success) {
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Centros de Custo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Novo centro de custo..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {costCenters.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum centro de custo cadastrado
              </p>
            ) : (
              costCenters.map((cc) => (
                <div
                  key={cc.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
                >
                  {editingId === cc.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 ${cc.status === "inativo" ? "text-muted-foreground line-through" : ""}`}>
                        {cc.name}
                      </span>
                      <Badge variant={cc.status === "ativo" ? "default" : "secondary"}>
                        {cc.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => handleStartEdit(cc)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          onUpdate(cc.id, { status: cc.status === "ativo" ? "inativo" : "ativo" })
                        }
                      >
                        {cc.status === "ativo" ? (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Power className="h-4 w-4 text-success" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir centro de custo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir <strong>{cc.name}</strong>? Só é
                              possível excluir se não houver fornecedor/colaborador ativo
                              vinculado a este centro de custo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(cc.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogClose asChild>
          <Button variant="outline" className="mt-2 w-full">
            Fechar
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
