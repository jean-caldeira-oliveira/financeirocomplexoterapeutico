export type CostCenterStatus = "ativo" | "inativo";

export interface CostCenter {
  id: string;
  name: string;
  status: CostCenterStatus;
  createdAt: string;
  updatedAt: string;
}
