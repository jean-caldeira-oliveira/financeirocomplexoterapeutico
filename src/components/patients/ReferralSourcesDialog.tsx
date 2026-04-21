import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { ReferralSource } from '@/hooks/useReferralSources';

interface ReferralSourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: ReferralSource[];
  onAdd: (name: string) => ReferralSource | null | Promise<ReferralSource | null>;
  onUpdate: (id: string, name: string) => boolean | Promise<boolean>;
  onDelete: (id: string) => void;
}

export function ReferralSourcesDialog({
  open,
  onOpenChange,
  sources,
  onAdd,
  onUpdate,
  onDelete,
}: ReferralSourcesDialogProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    const result = onAdd(newName);
    if (result) {
      setNewName('');
    } else if (newName.trim()) {
      setError('Este encaminhamento já existe');
    }
  };

  const handleStartEdit = (source: ReferralSource) => {
    setEditingId(source.id);
    setEditingName(source.name);
    setError('');
  };

  const handleSaveEdit = () => {
    if (editingId) {
      const success = onUpdate(editingId, editingName);
      if (success) {
        setEditingId(null);
        setEditingName('');
        setError('');
      } else {
        setError('Este encaminhamento já existe');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Encaminhamentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new */}
          <div className="flex gap-2">
            <Input
              placeholder="Novo local de encaminhamento..."
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* List */}
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {sources.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum encaminhamento cadastrado
              </p>
            ) : (
              sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
                >
                  {editingId === source.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
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
                      <span className="flex-1">{source.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEdit(source)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir encaminhamento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir <strong>{source.name}</strong>?
                              Pacientes já cadastrados com este encaminhamento não serão afetados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(source.id)}
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
