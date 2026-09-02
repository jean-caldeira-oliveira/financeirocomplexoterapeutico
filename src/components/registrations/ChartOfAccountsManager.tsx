import { useState } from "react";
import { Check, Pencil, Plus, Power, PowerOff, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ChartOfAccount } from "@/types/chartOfAccounts";
import { AddChartOfAccountData } from "@/hooks/useChartOfAccounts";

interface ChartOfAccountsManagerProps {
  accounts: ChartOfAccount[];
  onAdd: (data: AddChartOfAccountData) => Promise<ChartOfAccount | null>;
  onUpdate: (
    id: string,
    updates: Partial<Pick<ChartOfAccount, "code" | "name" | "status">>
  ) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function ChartOfAccountsManager({
  accounts,
  onAdd,
  onUpdate,
  onDelete,
}: ChartOfAccountsManagerProps) {
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState("");
  const [editingName, setEditingName] = useState("");

  const handleAdd = async () => {
    if (!newCode.trim() || !newName.trim()) return;
    const result = await onAdd({ code: newCode, name: newName });
    if (result) {
      setNewCode("");
      setNewName("");
    }
  };

  const handleStartEdit = (acc: ChartOfAccount) => {
    setEditingId(acc.id);
    setEditingCode(acc.code);
    setEditingName(acc.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const success = await onUpdate(editingId, { code: editingCode, name: editingName });
    if (success) {
      setEditingId(null);
      setEditingCode("");
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingCode("");
    setEditingName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Código"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          className="w-28"
        />
        <Input
          placeholder="Nome da conta..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {accounts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma conta cadastrada
          </p>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
            >
              {editingId === acc.id ? (
                <>
                  <Input
                    value={editingCode}
                    onChange={(e) => setEditingCode(e.target.value)}
                    className="w-24"
                  />
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
                  <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">
                    {acc.code}
                  </span>
                  <span className={`flex-1 ${acc.status === "inativo" ? "text-muted-foreground line-through" : ""}`}>
                    {acc.name}
                  </span>
                  <Badge variant={acc.status === "ativo" ? "default" : "secondary"}>
                    {acc.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => handleStartEdit(acc)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      onUpdate(acc.id, { status: acc.status === "ativo" ? "inativo" : "ativo" })
                    }
                  >
                    {acc.status === "ativo" ? (
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
                        <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir <strong>{acc.name}</strong>? Só é
                          possível excluir se não houver fornecedor/colaborador ativo
                          vinculado a esta conta.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(acc.id)}
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
  );
}
