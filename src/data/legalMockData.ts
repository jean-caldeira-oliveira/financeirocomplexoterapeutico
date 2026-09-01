// Dados fictícios (mock) para o Dashboard Jurídico.
// Substituir por dados reais (Supabase) quando o módulo Jurídico for implementado.

export type LegalRiskLevel = "alto" | "medio" | "baixo";

export interface LegalRiskSummary {
  level: LegalRiskLevel;
  count: number;
  valueAtStake: number;
}

export const legalRiskSummary: LegalRiskSummary[] = [
  { level: "alto", count: 4, valueAtStake: 420000 },
  { level: "medio", count: 11, valueAtStake: 280000 },
  { level: "baixo", count: 9, valueAtStake: 150000 },
];

export type DeadlineUrgency = "hoje" | "semana" | "mes";

export interface LegalDeadline {
  id: string;
  date: string; // dd/MM
  description: string;
  urgency: DeadlineUrgency;
}

export const legalDeadlines: LegalDeadline[] = [
  { id: "1", date: "02/09", description: "Resposta à notificação", urgency: "hoje" },
  { id: "2", date: "04/09", description: "Audiência trabalhista", urgency: "hoje" },
  { id: "3", date: "07/09", description: "Renovação contratual", urgency: "semana" },
  { id: "4", date: "09/09", description: "Prazo de defesa", urgency: "semana" },
  { id: "5", date: "12/09", description: "Envio de documentação complementar", urgency: "semana" },
  { id: "6", date: "15/09", description: "Audiência de conciliação", urgency: "semana" },
  { id: "7", date: "18/09", description: "Prazo recursal", urgency: "semana" },
  { id: "8", date: "20/09", description: "Reunião com escritório parceiro", urgency: "semana" },
  { id: "9", date: "25/09", description: "Vencimento de contrato de prestação de serviço", urgency: "mes" },
  { id: "10", date: "28/09", description: "Renovação de alvará", urgency: "mes" },
  { id: "11", date: "30/09", description: "Prazo para manifestação em processo cível", urgency: "mes" },
];

export type LegalCaseStatus =
  | "em_andamento"
  | "aguardando_decisao"
  | "aguardando_documentacao"
  | "critico"
  | "encerrado_mes";

export interface LegalCaseStatusSummary {
  status: LegalCaseStatus;
  count: number;
}

export const legalCaseStatusSummary: LegalCaseStatusSummary[] = [
  { status: "em_andamento", count: 12 },
  { status: "aguardando_decisao", count: 5 },
  { status: "aguardando_documentacao", count: 4 },
  { status: "critico", count: 2 },
  { status: "encerrado_mes", count: 6 },
];
