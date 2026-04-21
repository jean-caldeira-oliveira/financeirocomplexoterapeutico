export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export type InvoiceType = 'enrollment' | 'monthly' | 'contract_break' | 'damage' | 'extra_service';

export type InvoicePaymentMethod = 'pix' | 'cash' | 'card' | 'transfer_or_boleto';

export type InvoiceBillingMethod = '' | 'boleto' | 'cartao' | 'pix' | 'transferencia' | 'dinheiro';

export interface InvoicePayment {
  id: string;
  amount: number;
  paymentDate: string;
  method: InvoicePaymentMethod;
  isLate?: boolean;
  note?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  dueDate: string;
  installmentNumber: number;
  totalInstallments: number;
  status: InvoiceStatus;
  type: InvoiceType;
  description?: string;
  paidAt?: string;
  payments?: InvoicePayment[];
  interestRateMonthly?: number;
  fineRate: number;
  gracePeriodDays: number;
  billingMethod: InvoiceBillingMethod;
  createdAt: string;
}

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  pending: 'Pendente',
  paid: 'Recebido',
  overdue: 'Atrasado',
};

export const invoiceTypeLabels: Record<InvoiceType, string> = {
  enrollment: 'Adesão',
  monthly: 'Mensalidade',
  contract_break: 'Quebra de Contrato',
  damage: 'Danos/Ressarcimento',
  extra_service: 'Serviço Avulso',
};

export const extraInvoiceTypes: InvoiceType[] = ['contract_break', 'damage', 'extra_service'];

export const invoicePaymentMethodLabels: Record<InvoicePaymentMethod, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  card: 'Cartão',
  transfer_or_boleto: 'Transferência/Boleto',
};

export const billingMethodLabels: Record<InvoiceBillingMethod, string> = {
  '': 'Não definido',
  boleto: 'Boleto',
  cartao: 'Cartão',
  pix: 'PIX',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
};
