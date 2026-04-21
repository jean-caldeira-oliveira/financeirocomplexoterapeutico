export type TransactionType = 'income' | 'expense';

// CV - Custo Variado
export type CustoVariadoCategory = 
  | 'cv_materiais'
  | 'cv_manutencao'
  | 'cv_marketing'
  | 'cv_outros';

// CF - Custo Fixo
export type CustoFixoCategory = 
  | 'cf_aluguel'
  | 'cf_agua'
  | 'cf_energia'
  | 'cf_internet_telefone'
  | 'cf_contabilidade'
  | 'cf_outros';

// IMP - Impostos
export type ImpostosCategory = 
  | 'imp_impostos'
  | 'imp_taxas';

// PROL - Pró-labore
export type ProlaboreCategory = 
  | 'prol_socios'
  | 'prol_folha';

// BC - Banco
export type BancoCategory = 
  | 'bc_tarifas'
  | 'bc_juros'
  | 'bc_emprestimos';

// REC - Receita (entradas)
export type IncomeCategory = 
  | 'rec_mensalidade'
  | 'rec_consulta_avulsa'
  | 'rec_outros';

export type ExpenseCategory = 
  | CustoVariadoCategory 
  | CustoFixoCategory 
  | ImpostosCategory 
  | ProlaboreCategory 
  | BancoCategory;

export type TransactionCategory = IncomeCategory | ExpenseCategory;

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export type Ward = 'feminina' | 'masculina';

export interface Patient {
  id: string;
  name: string;
  entryDate: string;
  dueDay: number;
  monthlyFee: number;
  installments: number;
  hasEnrollmentFee: boolean;
  enrollmentFee: number;
  enrollmentDueDate?: string;
  firstInstallmentDate?: string;
  guardianName: string;
  guardianContact: string;
  ward: Ward;
  referralSource: string;
  interestRateMonthly: number; // Taxa de juros mensal por paciente (%)
  active: boolean;
  createdAt: string;
}

export const wardLabels: Record<Ward, string> = {
  feminina: 'Feminina',
  masculina: 'Masculina',
};

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  status?: PaymentStatus;
  patientId?: string;
}

export const incomeCategoryLabels: Record<IncomeCategory, string> = {
  rec_mensalidade: 'Mensalidade',
  rec_consulta_avulsa: 'Consulta Avulsa',
  rec_outros: 'Outros',
};

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  // CV - Custo Variado
  cv_materiais: 'Materiais',
  cv_manutencao: 'Manutenção',
  cv_marketing: 'Marketing',
  cv_outros: 'Outros CV',
  // CF - Custo Fixo
  cf_aluguel: 'Aluguel',
  cf_agua: 'Água',
  cf_energia: 'Energia',
  cf_internet_telefone: 'Internet/Telefone',
  cf_contabilidade: 'Contabilidade',
  cf_outros: 'Outros CF',
  // IMP - Impostos
  imp_impostos: 'Impostos',
  imp_taxas: 'Taxas',
  // PROL - Pró-labore
  prol_socios: 'Pró-labore Sócios',
  prol_folha: 'Folha de Pagamento',
  // BC - Banco
  bc_tarifas: 'Tarifas Bancárias',
  bc_juros: 'Juros',
  bc_emprestimos: 'Empréstimos',
};

export const categoryLabels: Record<TransactionCategory, string> = {
  ...incomeCategoryLabels,
  ...expenseCategoryLabels,
};

export const incomeCategories: IncomeCategory[] = [
  'rec_mensalidade',
  'rec_consulta_avulsa',
  'rec_outros',
];

export const expenseCategories: ExpenseCategory[] = [
  'cv_materiais', 'cv_manutencao', 'cv_marketing', 'cv_outros',
  'cf_aluguel', 'cf_agua', 'cf_energia', 'cf_internet_telefone', 'cf_contabilidade', 'cf_outros',
  'imp_impostos', 'imp_taxas',
  'prol_socios', 'prol_folha',
  'bc_tarifas', 'bc_juros', 'bc_emprestimos',
];

// Expense category groups for better visualization
export type ExpenseCategoryGroup = 'custos_variaveis' | 'custos_fixos' | 'impostos' | 'prolabore' | 'banco';

export const expenseCategoryGroups: Record<ExpenseCategoryGroup, ExpenseCategory[]> = {
  custos_variaveis: ['cv_materiais', 'cv_manutencao', 'cv_marketing', 'cv_outros'],
  custos_fixos: ['cf_aluguel', 'cf_agua', 'cf_energia', 'cf_internet_telefone', 'cf_contabilidade', 'cf_outros'],
  impostos: ['imp_impostos', 'imp_taxas'],
  prolabore: ['prol_socios', 'prol_folha'],
  banco: ['bc_tarifas', 'bc_juros', 'bc_emprestimos'],
};

export const expenseCategoryGroupLabels: Record<ExpenseCategoryGroup, string> = {
  custos_variaveis: 'CV - Custo Variado',
  custos_fixos: 'CF - Custo Fixo',
  impostos: 'IMP - Impostos',
  prolabore: 'PROL - Pró-labore',
  banco: 'BC - Banco',
};
