import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface AuditLogEntry {
  id: string;
  // trigger-managed (table-level ops)
  tableName: string | null;
  operation: string | null;
  userId: string | null;
  recordId: string | null;
  // app-level (frontend CRUD ops)
  appUserId: string | null;
  appUserName: string | null;
  appUserEmail: string | null;
  appModule: string | null;
  appAction: string | null;
  appDescription: string | null;
  appEntityName: string | null;
  appEntityId: string | null;
  createdAt: string;
}

const mapRow = (row: any): AuditLogEntry => ({
  id: row.id,
  tableName: row.table_name ?? null,
  operation: row.operation ?? null,
  userId: row.user_id ?? null,
  recordId: row.record_id ?? null,
  appUserId: row.app_user_id ?? null,
  appUserName: row.app_user_name ?? null,
  appUserEmail: row.app_user_email ?? null,
  appModule: row.app_module ?? null,
  appAction: row.app_action ?? null,
  appDescription: row.app_description ?? null,
  appEntityName: row.app_entity_name ?? null,
  appEntityId: row.app_entity_id ?? null,
  createdAt: row.created_at,
});

export function useAuditLog(selectedMonth: Date) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 1).toISOString();

    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .gte("created_at", from)
      .lt("created_at", to)
      .not("app_module", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit log:", error);
      toast.error("Erro ao carregar logs");
    } else {
      setLogs((data || []).map(mapRow));
    }

    setIsLoading(false);
  }, [user, selectedMonth]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, isLoading, refetch: fetchLogs };
}
