import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  module: string;
  action: string;
  description: string;
  entityName: string | null;
  entityId: string | null;
  createdAt: string;
}

const mapRow = (row: any): AuditLogEntry => ({
  id: row.id,
  userId: row.user_id ?? null,
  userName: row.user_name ?? null,
  userEmail: row.user_email ?? null,
  module: row.module,
  action: row.action,
  description: row.description,
  entityName: row.entity_name ?? null,
  entityId: row.entity_id ?? null,
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

    // Build month range: from first day of month to first day of next month
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 1).toISOString();

    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .gte("created_at", from)
      .lt("created_at", to)
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
