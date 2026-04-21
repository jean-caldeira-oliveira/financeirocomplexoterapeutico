export type BillPaymentMethod = 'pix' | 'dinheiro' | 'cartao' | 'transferencia' | 'boleto';

export const billPaymentMethodLabels: Record<BillPaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  transferencia: 'Transferência',
  boleto: 'Boleto',
};

export type BillStatus = 'pending' | 'paid' | 'overdue';

export type BillRecurrence = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  subcategory: string;
  status: BillStatus;
  recurrence: BillRecurrence;
  installmentNumber?: number;
  totalInstallments?: number;
  paidAt?: string;
  paymentDate?: string;
  paidAmount?: number;
  paymentMethod?: BillPaymentMethod;
  createdAt: string;
}

export const billStatusLabels: Record<BillStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
};

export const billRecurrenceLabels: Record<BillRecurrence, string> = {
  none: 'Sem recorrência',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  yearly: 'Anual',
};
