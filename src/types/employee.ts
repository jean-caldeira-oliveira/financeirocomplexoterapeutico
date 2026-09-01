export type EmploymentType = "CLT" | "PJ" | "Estagiário" | "Diretoria";
export type EmployeeStatus = "ativo" | "inativo" | "desligado";
export type EmployeePaymentMethod = "transferencia" | "pix" | "boleto";

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  document: string; // CPF, somente dígitos
  employmentType: EmploymentType;
  roleTitle: string;
  costCenterId: string;
  defaultAccountId: string;
  admissionDate: string;
  terminationDate?: string;
  status: EmployeeStatus;
  paymentMethod?: EmployeePaymentMethod;
  bankInfoOrPixKey?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const employeeStatusLabels: Record<EmployeeStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  desligado: "Desligado",
};

export const employeePaymentMethodLabels: Record<EmployeePaymentMethod, string> = {
  transferencia: "Transferência",
  pix: "PIX",
  boleto: "Boleto",
};
