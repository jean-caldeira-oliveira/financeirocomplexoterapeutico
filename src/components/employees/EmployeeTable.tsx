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
import { Employee, employeeStatusLabels } from "@/types/employee";
import { ChartOfAccount } from "@/types/chartOfAccounts";
import { CostCenter } from "@/types/costCenter";
import { formatCPF } from "@/utils/documentValidation";
import { format, isValid } from "date-fns";
import { Pencil, Power, PowerOff, Trash2, UserX } from "lucide-react";

interface EmployeeTableProps {
  employees: Employee[];
  accounts: ChartOfAccount[];
  costCenters: CostCenter[];
  onEdit: (employee: Employee) => void;
  onToggleActive: (employee: Employee) => void;
  onTerminate: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<Employee["status"], string> = {
  ativo: "bg-green-500 text-white hover:bg-green-600",
  inativo: "bg-gray-500 text-white hover:bg-gray-600",
  desligado: "bg-red-500 text-white hover:bg-red-600",
};

export function EmployeeTable({
  employees,
  accounts,
  costCenters,
  onEdit,
  onToggleActive,
  onTerminate,
  onDelete,
}: EmployeeTableProps) {
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "-";
  const costCenterName = (id: string) => costCenters.find((c) => c.id === id)?.name ?? "-";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (!isValid(date)) return "-";
    return format(date, "dd/MM/yyyy");
  };

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Vínculo</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Centro de Custo</TableHead>
            <TableHead>Admissão</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id} className={employee.status !== "ativo" ? "opacity-60" : ""}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {employee.code}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[employee.status]}>
                  {employeeStatusLabels[employee.status]}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{employee.fullName}</TableCell>
              <TableCell>{formatCPF(employee.document)}</TableCell>
              <TableCell>{employee.employmentType}</TableCell>
              <TableCell>{employee.roleTitle}</TableCell>
              <TableCell>{costCenterName(employee.costCenterId)}</TableCell>
              <TableCell>{formatDate(employee.admissionDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => onEdit(employee)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>

                  {employee.status !== "desligado" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={() => onToggleActive(employee)}>
                          {employee.status === "ativo" ? (
                            <PowerOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Power className="h-4 w-4 text-success" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {employee.status === "ativo" ? "Inativar" : "Ativar"}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {employee.status !== "desligado" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={() => onTerminate(employee)}>
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Registrar desligamento</TooltipContent>
                    </Tooltip>
                  )}

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
                        <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir <strong>{employee.fullName}</strong>? Só é
                          possível excluir se não houver nenhum lançamento vinculado a este
                          colaborador — caso contrário, registre o desligamento.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(employee.id)}
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
