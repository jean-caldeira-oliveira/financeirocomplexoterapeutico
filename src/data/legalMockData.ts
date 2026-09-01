// Dados fictícios (mock) para o Dashboard Jurídico.
// Substituir por dados reais (Supabase) quando o módulo Jurídico for implementado.

export type LegalRiskLevel = "alto" | "medio" | "baixo";
export type LegalCaseStatus =
  | "em_andamento"
  | "aguardando_decisao"
  | "aguardando_documentacao"
  | "critico"
  | "encerrado_mes";

// "ativo" = processo que a clínica está movendo (autora/cobrando)
// "passivo" = processo que a clínica está sofrendo (ré/sendo processada)
export type LegalCasePolarity = "ativo" | "passivo";

export interface LegalCase {
  id: string;
  title: string;
  polarity: LegalCasePolarity;
  risk: LegalRiskLevel;
  status: LegalCaseStatus;
  valueAtStake: number;
}

export const legalCases: LegalCase[] = [
  // ── Passivos (a clínica está sendo processada) ──
  { id: "c1", title: "Reclamação trabalhista — ex-funcionário", polarity: "passivo", risk: "alto", status: "critico", valueAtStake: 180000 },
  { id: "c2", title: "Ação de indenização — familiar de paciente", polarity: "passivo", risk: "alto", status: "em_andamento", valueAtStake: 150000 },
  { id: "c3", title: "Reclamação trabalhista — equipe técnica", polarity: "passivo", risk: "alto", status: "aguardando_decisao", valueAtStake: 90000 },
  { id: "c4", title: "Ação consumerista — cobrança indevida", polarity: "passivo", risk: "medio", status: "em_andamento", valueAtStake: 60000 },
  { id: "c5", title: "Reclamação trabalhista — horas extras", polarity: "passivo", risk: "medio", status: "aguardando_documentacao", valueAtStake: 55000 },
  { id: "c6", title: "Ação civil — vizinho (ruído)", polarity: "passivo", risk: "medio", status: "em_andamento", valueAtStake: 40000 },
  { id: "c7", title: "Notificação extrajudicial — fornecedor", polarity: "passivo", risk: "medio", status: "aguardando_decisao", valueAtStake: 35000 },
  { id: "c8", title: "Reclamação trabalhista — adicional noturno", polarity: "passivo", risk: "baixo", status: "encerrado_mes", valueAtStake: 25000 },
  { id: "c9", title: "Ação de pequena causa — paciente", polarity: "passivo", risk: "baixo", status: "em_andamento", valueAtStake: 18000 },
  { id: "c10", title: "Reclamação de consumidor — Procon", polarity: "passivo", risk: "baixo", status: "encerrado_mes", valueAtStake: 12000 },

  // ── Ativos (a clínica está movendo) ──
  { id: "c11", title: "Cobrança judicial — mensalidades em aberto", polarity: "ativo", risk: "medio", status: "em_andamento", valueAtStake: 95000 },
  { id: "c12", title: "Execução de contrato — ex-paciente", polarity: "ativo", risk: "medio", status: "aguardando_decisao", valueAtStake: 70000 },
  { id: "c13", title: "Ação de despejo — imóvel alugado a terceiro", polarity: "ativo", risk: "medio", status: "em_andamento", valueAtStake: 65000 },
  { id: "c14", title: "Cobrança — convênio inadimplente", polarity: "ativo", risk: "medio", status: "aguardando_documentacao", valueAtStake: 50000 },
  { id: "c15", title: "Ação indenizatória — fornecedor inadimplente", polarity: "ativo", risk: "baixo", status: "em_andamento", valueAtStake: 35000 },
  { id: "c16", title: "Cobrança judicial — parcelamento não pago", polarity: "ativo", risk: "baixo", status: "aguardando_decisao", valueAtStake: 28000 },
  { id: "c17", title: "Cobrança — mensalidade atrasada (paciente A.)", polarity: "ativo", risk: "baixo", status: "encerrado_mes", valueAtStake: 15000 },
  { id: "c18", title: "Cobrança — mensalidade atrasada (paciente B.)", polarity: "ativo", risk: "baixo", status: "encerrado_mes", valueAtStake: 10000 },
];

export type DeadlineUrgency = "hoje" | "semana" | "mes";

export interface LegalDeadline {
  id: string;
  date: string; // dd/MM
  description: string;
  urgency: DeadlineUrgency;
  polarity: LegalCasePolarity;
}

export const legalDeadlines: LegalDeadline[] = [
  { id: "1", date: "02/09", description: "Resposta à notificação", urgency: "hoje", polarity: "passivo" },
  { id: "2", date: "04/09", description: "Audiência trabalhista", urgency: "hoje", polarity: "passivo" },
  { id: "3", date: "07/09", description: "Renovação contratual", urgency: "semana", polarity: "ativo" },
  { id: "4", date: "09/09", description: "Prazo de defesa", urgency: "semana", polarity: "passivo" },
  { id: "5", date: "12/09", description: "Envio de documentação complementar", urgency: "semana", polarity: "passivo" },
  { id: "6", date: "15/09", description: "Audiência de conciliação", urgency: "semana", polarity: "passivo" },
  { id: "7", date: "18/09", description: "Prazo recursal", urgency: "semana", polarity: "ativo" },
  { id: "8", date: "20/09", description: "Reunião com escritório parceiro", urgency: "semana", polarity: "ativo" },
  { id: "9", date: "25/09", description: "Vencimento de contrato de prestação de serviço", urgency: "mes", polarity: "ativo" },
  { id: "10", date: "28/09", description: "Renovação de alvará", urgency: "mes", polarity: "passivo" },
  { id: "11", date: "30/09", description: "Prazo para manifestação em processo cível", urgency: "mes", polarity: "ativo" },
];

export interface LegalRiskSummary {
  level: LegalRiskLevel;
  count: number;
  valueAtStake: number;
}

export interface LegalCaseStatusSummary {
  status: LegalCaseStatus;
  count: number;
}

const riskLevels: LegalRiskLevel[] = ["alto", "medio", "baixo"];
const caseStatuses: LegalCaseStatus[] = [
  "em_andamento",
  "aguardando_decisao",
  "aguardando_documentacao",
  "critico",
  "encerrado_mes",
];

export function filterCasesByPolarity(
  polarity: LegalCasePolarity | "todos"
): LegalCase[] {
  return polarity === "todos" ? legalCases : legalCases.filter((c) => c.polarity === polarity);
}

export function getRiskSummary(cases: LegalCase[]): LegalRiskSummary[] {
  return riskLevels.map((level) => {
    const matching = cases.filter((c) => c.risk === level);
    return {
      level,
      count: matching.length,
      valueAtStake: matching.reduce((sum, c) => sum + c.valueAtStake, 0),
    };
  });
}

export function getCaseStatusSummary(cases: LegalCase[]): LegalCaseStatusSummary[] {
  return caseStatuses.map((status) => ({
    status,
    count: cases.filter((c) => c.status === status).length,
  }));
}

export function filterDeadlinesByPolarity(
  polarity: LegalCasePolarity | "todos"
): LegalDeadline[] {
  return polarity === "todos"
    ? legalDeadlines
    : legalDeadlines.filter((d) => d.polarity === polarity);
}
