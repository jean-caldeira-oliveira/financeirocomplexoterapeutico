import { useEffect, useState } from "react";
import { Settings2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Employee,
  EmployeePaymentMethod,
  employeePaymentMethodLabels,
  EmploymentType,
} from "@/types/employee";
import { ChartOfAccount } from "@/types/chartOfAccounts";
import { CostCenter } from "@/types/costCenter";
import { EmployeeFormData } from "@/hooks/useEmployees";
import { formatCPF, isValidCPF, onlyDigits } from "@/utils/documentValidation";
import { format } from "date-fns";

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EmployeeFormData) => void;
  initialData?: Employee;
  mode: "create" | "edit";
  accounts: ChartOfAccount[];
  costCenters: CostCenter[];
  onManageAccounts: () => void;
  onManageCostCenters: () => void;
  isDocumentTaken: (document: string, excludeId?: string) => boolean;
}

const employmentTypes: EmploymentType[] = ["CLT", "PJ", "Estagiário", "Diretoria"];

function getDefaultFormData(): EmployeeFormData {
  return {
    fullName: "",
    document: "",
    employmentType: "CLT",
    roleTitle: "",
    costCenterId: "",
    defaultAccountId: "",
    admissionDate: new Date(),
    paymentMethod: undefined,
    bankInfoOrPixKey: "",
    notes: "",
  };
}

export function EmployeeForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  accounts,
  costCenters,
  onManageAccounts,
  onManageCostCenters,
  isDocumentTaken,
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(getDefaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        document: initialData.document,
        employmentType: initialData.employmentType,
        roleTitle: initialData.roleTitle,
        costCenterId: initialData.costCenterId,
        defaultAccountId: initialData.defaultAccountId,
        admissionDate: new Date(initialData.admissionDate),
        paymentMethod: initialData.paymentMethod,
        bankInfoOrPixKey: initialData.bankInfoOrPixKey ?? "",
        notes: initialData.notes ?? "",
      });
    } else {
      setFormData(getDefaultFormData());
    }
    setErrors({});
  }, [initialData, open]);

  const updateField = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Campo obrigatório";
    if (!formData.document.trim()) {
      newErrors.document = "Campo obrigatório";
    } else if (!isValidCPF(formData.document)) {
      newErrors.document = "CPF inválido";
    } else if (isDocumentTaken(onlyDigits(formData.document), initialData?.id)) {
      newErrors.document = "Já existe um colaborador com este CPF";
    }
    if (!formData.roleTitle.trim()) newErrors.roleTitle = "Campo obrigatório";
    if (!formData.costCenterId) newErrors.costCenterId = "Campo obrigatório";
    if (!formData.defaultAccountId) newErrors.defaultAccountId = "Campo obrigatório";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Cadastrar Colaborador" : "Editar Colaborador"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              maxLength={150}
              value={formData.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document">CPF *</Label>
              <Input
                id="document"
                value={formatCPF(formData.document)}
                onChange={(e) => updateField("document", onlyDigits(e.target.value))}
                placeholder="000.000.000-00"
                className={errors.document ? "border-destructive" : ""}
              />
              {errors.document && <p className="text-xs text-destructive">{errors.document}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Vínculo *</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(value: EmploymentType) => updateField("employmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleTitle">Cargo / Função *</Label>
            <Input
              id="roleTitle"
              maxLength={100}
              value={formData.roleTitle}
              onChange={(e) => updateField("roleTitle", e.target.value)}
              className={errors.roleTitle ? "border-destructive" : ""}
            />
            {errors.roleTitle && <p className="text-xs text-destructive">{errors.roleTitle}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conta Padrão (Plano de Contas) *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onManageAccounts}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Gerenciar plano de contas</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.defaultAccountId}
                onValueChange={(value) => updateField("defaultAccountId", value)}
              >
                <SelectTrigger className={errors.defaultAccountId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      Nenhuma conta cadastrada.
                      <br />
                      <Button variant="link" className="h-auto p-0" onClick={onManageAccounts}>
                        Clique aqui para adicionar
                      </Button>
                    </div>
                  ) : (
                    accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} — {acc.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.defaultAccountId && (
                <p className="text-xs text-destructive">{errors.defaultAccountId}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Centro de Custo *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onManageCostCenters}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Gerenciar centros de custo</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.costCenterId}
                onValueChange={(value) => updateField("costCenterId", value)}
              >
                <SelectTrigger className={errors.costCenterId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.costCenterId && (
                <p className="text-xs text-destructive">{errors.costCenterId}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Admissão *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.admissionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.admissionDate ? format(formData.admissionDate, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.admissionDate}
                  onSelect={(date) => date && updateField("admissionDate", date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={formData.paymentMethod ?? "none"}
                onValueChange={(value) =>
                  updateField(
                    "paymentMethod",
                    value === "none" ? undefined : (value as EmployeePaymentMethod)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  {Object.entries(employeePaymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankInfoOrPixKey">Banco/Agência/Conta ou Chave PIX</Label>
              <Input
                id="bankInfoOrPixKey"
                value={formData.bankInfoOrPixKey}
                onChange={(e) => updateField("bankInfoOrPixKey", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>{mode === "create" ? "Cadastrar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
