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
import { Patient, wardLabels } from "@/types/transaction";
import { Invoice } from "@/types/invoice";
import {
  getContractEndDate,
  isContractFinished,
} from "@/utils/patientContract";
import { format, isValid } from "date-fns";
import {
  CalendarPlus,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";

interface PatientTableProps {
  patients: Patient[];
  invoices: Invoice[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onView: (patient: Patient) => void;
  onToggleActive: (id: string) => void;
  onExtendContract?: (patient: Patient) => void;
}

export function PatientTable({
  patients,
  invoices,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
  onExtendContract,
}: PatientTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (!isValid(date)) return "-";
    return format(date, "dd/MM/yyyy");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Ala</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Saída</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Mensalidade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient, index) => {
            const contractEndDate = getContractEndDate(patient, invoices);
            const finished = isContractFinished(patient, invoices);

            return (
              <TableRow
                key={patient.id}
                className={!patient.active ? "opacity-60" : ""}
              >
                <TableCell className="font-medium text-muted-foreground">
                  {patient.active ? index + 1 : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge
                      className={
                        patient.active
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }
                    >
                      {patient.active ? "Ativo" : "Inativo"}
                    </Badge>
                    {finished && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                            Contrato Finalizado
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Pendente renovação — contrato encerrado em{" "}
                          {contractEndDate
                            ? formatDate(contractEndDate.toISOString())
                            : "-"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{patient.name}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      patient.ward === "feminina"
                        ? "bg-pink-500 hover:bg-pink-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }
                  >
                    {wardLabels[patient.ward]}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(patient.entryDate)}</TableCell>
                <TableCell>
                  {contractEndDate
                    ? formatDate(contractEndDate.toISOString())
                    : "-"}
                </TableCell>
                <TableCell>Dia {patient.dueDay}</TableCell>
                <TableCell>{formatCurrency(patient.monthlyFee)}</TableCell>
                <TableCell>{patient.guardianName || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onView(patient)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalhes</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(patient)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>

                    {patient.active && onExtendContract && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onExtendContract(patient)}
                          >
                            <CalendarPlus className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Estender Contrato</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onToggleActive(patient.id)}
                        >
                          {patient.active ? (
                            <PowerOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Power className="h-4 w-4 text-success" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {patient.active ? "Desativar" : "Ativar"}
                      </TooltipContent>
                    </Tooltip>

                    {patient.active && (
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
                            <AlertDialogTitle>
                              Excluir paciente?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir{" "}
                              <strong>{patient.name}</strong>? Esta ação não
                              pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(patient.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
