export type BillPaymentMethod =
  | "pix"
  | "dinheiro"
  | "cartao"
  | "transferencia"
  | "boleto";

export const billPaymentMethodLabels: Record<BillPaymentMethod, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  boleto: "Boleto",
};

export type BillStatus = "pending" | "paid" | "overdue" | "partially_paid" | "pre_system";

export type BillRecurrence =
  | "none"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  subcategory: string;
  status: BillStatus;
  recurrence: BillRecurrence;
  recurrenceGroupId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  paidAt?: string;
  paymentDate?: string;
  paidAmount?: number;
  paymentMethod?: BillPaymentMethod;
  notes?: string;
  paymentNotes?: string;
  createdAt: string;
  // Computed from bill_payments
  payments?: BillPayment[];
  totalPaid?: number;
}

/** Represents a single payment entry in the bill_payments table */
export interface BillPayment {
  id: string;
  billId: string;
  userId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: BillPaymentMethod;
  notes?: string;
  createdAt: string;
}

/** Represents an audit log entry in the bill_history table */
export interface BillHistory {
  id: string;
  billId: string;
  userId?: string;
  userName?: string;
  action:
    | "create"
    | "edit"
    | "partial_payment"
    | "full_payment"
    | "revert_payment"
    | "delete"
    | "status_change";
  description?: string;
  createdAt: string;
}

/** Scope options for batch editing recurring/installment bills */
export type BillEditScope = "only_this" | "this_and_future" | "all_series";

export const billStatusLabels: Record<BillStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  partially_paid: "Parcialmente Pago",
  pre_system: "Anterior ao Sistema",
};

export const billRecurrenceLabels: Record<BillRecurrence, string> = {
  none: "Sem recorrência",
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
  yearly: "Anual",
};
