export type RoomType = "coletivo" | "semi_privativo" | "privativo";

export const roomTypeLabels: Record<RoomType, string> = {
  coletivo: "Quarto Coletivo",
  semi_privativo: "Quarto Semi-Privativo",
  privativo: "Quarto Privativo",
};

export const roomTypeDescriptions: Record<RoomType, string> = {
  coletivo: "Até 10 camas · Guarda-roupa individual · Banheiro coletivo",
  semi_privativo: "2 camas · Guarda-roupas · TV · Frigobar · Banheiro exclusivo",
  privativo: "Exclusivo · 1 cama · TV · Frigobar · Banheiro exclusivo",
};

export const roomTypeOrder: RoomType[] = ["coletivo", "semi_privativo", "privativo"];

export const PSYCHIATRIC_FOLLOWUP_FEE = 500;
export const LAUNDRY_FEE = 200;

export interface RoomPricing {
  enrollmentFee: number;
  monthlyFee: number;
}

export interface BudgetQuote {
  id: string;
  userId: string;
  userName?: string;
  patientName: string;
  patientDocument?: string;
  patientBirthDate?: string;
  guardianName: string;
  guardianDocument?: string;
  guardianPhone?: string;
  roomPricing: Record<RoomType, RoomPricing>;
  psychiatricFollowup: boolean;
  laundryIncluded: boolean;
  periodMonths?: string;
  validityDays: number;
  notes?: string;
  createdAt: string;
}
