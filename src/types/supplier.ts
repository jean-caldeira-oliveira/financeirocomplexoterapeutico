export type SupplierPersonType = "PF" | "PJ";
export type SupplierStatus = "ativo" | "inativo";

export interface Supplier {
  id: string;
  code: string;
  personType: SupplierPersonType;
  legalName: string;
  tradeName?: string;
  document: string; // CPF (11) ou CNPJ (14), somente dígitos
  phone?: string;
  email?: string;
  address?: string;
  bankInfo?: string;
  pixKey?: string;
  defaultAccountId: string;
  defaultCostCenterId: string;
  status: SupplierStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const supplierStatusLabels: Record<SupplierStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
};
