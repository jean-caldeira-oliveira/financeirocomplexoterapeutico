import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CostCenter } from "@/types/costCenter";
import { CostCentersManager } from "@/components/registrations/CostCentersManager";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Centros de Custo</DialogTitle>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          <CostCentersManager
            costCenters={costCenters}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
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
