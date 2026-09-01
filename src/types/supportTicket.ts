export type TicketType =
  | "nova_funcionalidade"
  | "correcao_bug"
  | "duvida"
  | "ajuste";

export const ticketTypeLabels: Record<TicketType, string> = {
  nova_funcionalidade: "Nova Funcionalidade",
  correcao_bug: "Correção de Bug",
  duvida: "Dúvida",
  ajuste: "Ajuste",
};

export type TicketSeverity = "bloqueio" | "alta" | "media" | "baixa";

export const ticketSeverityLabels: Record<TicketSeverity, string> = {
  bloqueio: "Bloqueio",
  alta: "Alta Prioridade",
  media: "Média Prioridade",
  baixa: "Baixa Prioridade",
};

export type TicketStatus =
  | "triagem"
  | "em_desenvolvimento"
  | "validacao"
  | "concluido";

export const ticketStatusLabels: Record<TicketStatus, string> = {
  triagem: "Triagem",
  em_desenvolvimento: "Em Desenvolvimento",
  validacao: "Validação",
  concluido: "Concluído",
};

export const ticketTabLabels: Record<string, string> = {
  geral: "Geral / Outro",
  dashboard: "Dashboard",
  pacientes: "Pacientes",
  cobrancas: "Cobranças",
  contas: "Contas",
  relatorios: "Relatórios",
  admin: "Admin",
  logs: "Logs",
  suporte: "Suporte",
};

export interface SupportTicket {
  id: string;
  userId: string;
  userName?: string;
  ticketType: TicketType;
  severity: TicketSeverity;
  tab: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  commentCount?: number;
}

export interface SupportTicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName?: string;
  comment: string;
  createdAt: string;
}
