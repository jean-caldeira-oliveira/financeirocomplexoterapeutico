import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Supplier, SupplierPersonType } from "@/types/supplier";
import { ChartOfAccount } from "@/types/chartOfAccounts";
import { CostCenter } from "@/types/costCenter";
import { SupplierFormData } from "@/hooks/useSuppliers";
import { formatDocument, isValidDocument, onlyDigits } from "@/utils/documentValidation";

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SupplierFormData) => void;
  initialData?: Supplier;
  mode: "create" | "edit";
  accounts: ChartOfAccount[];
  costCenters: CostCenter[];
  onManageAccounts: () => void;
  onManageCostCenters: () => void;
  isDocumentTaken: (document: string, excludeId?: string) => boolean;
}

function getDefaultFormData(): SupplierFormData {
  return {
    personType: "PJ",
    legalName: "",
    tradeName: "",
    document: "",
    phone: "",
    email: "",
    address: "",
    bankInfo: "",
    pixKey: "",
    defaultAccountId: "",
    defaultCostCenterId: "",
    notes: "",
  };
}

export function SupplierForm({
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
}: SupplierFormProps) {
  const [formData, setFormData] = useState<SupplierFormData>(getDefaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        personType: initialData.personType,
        legalName: initialData.legalName,
        tradeName: initialData.tradeName ?? "",
        document: initialData.document,
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        address: initialData.address ?? "",
        bankInfo: initialData.bankInfo ?? "",
        pixKey: initialData.pixKey ?? "",
        defaultAccountId: initialData.defaultAccountId,
        defaultCostCenterId: initialData.defaultCostCenterId,
        notes: initialData.notes ?? "",
      });
    } else {
      setFormData(getDefaultFormData());
    }
    setErrors({});
  }, [initialData, open]);

  const updateField = <K extends keyof SupplierFormData>(key: K, value: SupplierFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.legalName.trim()) {
      newErrors.legalName = "Campo obrigatório";
    }
    if (!formData.document.trim()) {
      newErrors.document = "Campo obrigatório";
    } else if (!isValidDocument(formData.document, formData.personType)) {
      newErrors.document = formData.personType === "PF" ? "CPF inválido" : "CNPJ inválido";
    } else if (isDocumentTaken(onlyDigits(formData.document), initialData?.id)) {
      newErrors.document = "Já existe um fornecedor com este documento";
    }
    if (!formData.defaultAccountId) {
      newErrors.defaultAccountId = "Campo obrigatório";
    }
    if (!formData.defaultCostCenterId) {
      newErrors.defaultCostCenterId = "Campo obrigatório";
    }

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
          <DialogTitle>{mode === "create" ? "Cadastrar Fornecedor" : "Editar Fornecedor"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Pessoa *</Label>
            <Select
              value={formData.personType}
              onValueChange={(value: SupplierPersonType) => updateField("personType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalName">
              {formData.personType === "PJ" ? "Razão Social *" : "Nome *"}
            </Label>
            <Input
              id="legalName"
              maxLength={150}
              value={formData.legalName}
              onChange={(e) => updateField("legalName", e.target.value)}
              className={errors.legalName ? "border-destructive" : ""}
            />
            {errors.legalName && <p className="text-xs text-destructive">{errors.legalName}</p>}
          </div>

          {formData.personType === "PJ" && (
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia</Label>
              <Input
                id="tradeName"
                maxLength={100}
                value={formData.tradeName}
                onChange={(e) => updateField("tradeName", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="document">{formData.personType === "PF" ? "CPF *" : "CNPJ *"}</Label>
            <Input
              id="document"
              value={formatDocument(formData.document, formData.personType)}
              onChange={(e) => updateField("document", onlyDigits(e.target.value))}
              placeholder={formData.personType === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
              className={errors.document ? "border-destructive" : ""}
            />
            {errors.document && <p className="text-xs text-destructive">{errors.document}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              placeholder="Rua, nº, bairro, cidade, UF, CEP"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankInfo">Banco / Agência / Conta</Label>
              <Input
                id="bankInfo"
                value={formData.bankInfo}
                onChange={(e) => updateField("bankInfo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input
                id="pixKey"
                value={formData.pixKey}
                onChange={(e) => updateField("pixKey", e.target.value)}
              />
            </div>
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
                <Label>Centro de Custo Padrão *</Label>
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
                value={formData.defaultCostCenterId}
                onValueChange={(value) => updateField("defaultCostCenterId", value)}
              >
                <SelectTrigger className={errors.defaultCostCenterId ? "border-destructive" : ""}>
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
              {errors.defaultCostCenterId && (
                <p className="text-xs text-destructive">{errors.defaultCostCenterId}</p>
              )}
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
