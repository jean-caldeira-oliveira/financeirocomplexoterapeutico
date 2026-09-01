export type ChartOfAccountStatus = "ativo" | "inativo";

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  status: ChartOfAccountStatus;
  createdAt: string;
  updatedAt: string;
}
