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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Supplier } from "@/types/supplier";
import { ChartOfAccount } from "@/types/chartOfAccounts";
import { CostCenter } from "@/types/costCenter";
import { formatDocument } from "@/utils/documentValidation";
import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";

interface SupplierTableProps {
  suppliers: Supplier[];
  accounts: ChartOfAccount[];
  costCenters: CostCenter[];
  onEdit: (supplier: Supplier) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SupplierTable({
  suppliers,
  accounts,
  costCenters,
  onEdit,
  onToggleStatus,
  onDelete,
}: SupplierTableProps) {
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "-";
  const costCenterName = (id: string) => costCenters.find((c) => c.id === id)?.name ?? "-";

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nome / Razão Social</TableHead>
            <TableHead>CPF/CNPJ</TableHead>
            <TableHead>Conta Padrão</TableHead>
            <TableHead>Centro de Custo</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id} className={supplier.status === "inativo" ? "opacity-60" : ""}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {supplier.code}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    supplier.status === "ativo"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }
                >
                  {supplier.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {supplier.legalName}
                {supplier.tradeName && (
                  <div className="text-xs text-muted-foreground">{supplier.tradeName}</div>
                )}
              </TableCell>
              <TableCell>{formatDocument(supplier.document, supplier.personType)}</TableCell>
              <TableCell>{accountName(supplier.defaultAccountId)}</TableCell>
              <TableCell>{costCenterName(supplier.defaultCostCenterId)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {supplier.phone || supplier.email || "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => onEdit(supplier)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => onToggleStatus(supplier.id)}>
                        {supplier.status === "ativo" ? (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Power className="h-4 w-4 text-success" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {supplier.status === "ativo" ? "Inativar" : "Ativar"}
                    </TooltipContent>
                  </Tooltip>

                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir <strong>{supplier.legalName}</strong>? Só é
                          possível excluir se não houver nenhum lançamento vinculado a este
                          fornecedor — caso contrário, inative o cadastro.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(supplier.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
