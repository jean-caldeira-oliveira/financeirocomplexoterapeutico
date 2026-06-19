import { supabase } from "@/integrations/supabase/client";

export type AuditModule =
  | "pacientes"
  | "cobrancas"
  | "contas"
  | "transacoes"
  | "admin"
  | "sistema";

export type AuditAction =
  | "criar"
  | "editar"
  | "excluir"
  | "pagar"
  | "pagamento_parcial"
  | "reverter_pagamento"
  | "ativar"
  | "desativar"
  | "login"
  | "logout";

export interface WriteAuditLogParams {
  userId: string;
  userName: string;
  userEmail?: string;
  module: AuditModule;
  action: AuditAction;
  description: string;
  entityName?: string;
  entityId?: string;
}

/**
 * Writes a single immutable audit log entry to the database.
 * Errors are silently swallowed so they never break the main operation.
 */
export async function writeAuditLog(
  params: WriteAuditLogParams
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      user_id: params.userId,
      user_name: params.userName,
      user_email: params.userEmail ?? null,
      module: params.module,
      action: params.action,
      description: params.description,
      entity_name: params.entityName ?? null,
      entity_id: params.entityId ?? null,
    });
  } catch (err) {
    // Never let audit log failures break the main flow
    console.warn("[auditLog] Failed to write audit entry:", err);
  }
}
