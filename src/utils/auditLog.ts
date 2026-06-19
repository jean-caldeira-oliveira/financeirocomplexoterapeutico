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
 * Uses app_* columns that coexist with the trigger-managed columns.
 * Errors are silently swallowed so they never break the main operation.
 */
export async function writeAuditLog(
  params: WriteAuditLogParams
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      app_user_id: params.userId,
      app_user_name: params.userName,
      app_user_email: params.userEmail ?? null,
      app_module: params.module,
      app_action: params.action,
      app_description: params.description,
      app_entity_name: params.entityName ?? null,
      app_entity_id: params.entityId ?? null,
      // table_name and operation are required by the trigger function schema
      table_name: "app",
      operation: params.action,
    });
  } catch (err) {
    // Never let audit log failures break the main flow
    console.warn("[auditLog] Failed to write audit entry:", err);
  }
}
