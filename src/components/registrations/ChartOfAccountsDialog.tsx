import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartOfAccount } from "@/types/chartOfAccounts";
import { AddChartOfAccountData } from "@/hooks/useChartOfAccounts";
import { ChartOfAccountsManager } from "@/components/registrations/ChartOfAccountsManager";

interface ChartOfAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: ChartOfAccount[];
  onAdd: (data: AddChartOfAccountData) => Promise<ChartOfAccount | null>;
  onUpdate: (
    id: string,
    updates: Partial<Pick<ChartOfAccount, "code" | "name" | "status">>
  ) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function ChartOfAccountsDialog({
  open,
  onOpenChange,
  accounts,
  onAdd,
  onUpdate,
  onDelete,
}: ChartOfAccountsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Plano de Contas</DialogTitle>
        </DialogHeader>

        <div className="max-h-[450px] overflow-y-auto">
          <ChartOfAccountsManager
            accounts={accounts}
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
