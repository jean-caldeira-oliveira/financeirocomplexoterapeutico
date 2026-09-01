import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChartOfAccount } from "@/types/chartOfAccounts";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const mapRow = (row: any): ChartOfAccount => ({
  id: row.id,
  code: row.code,
  name: row.name,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface AddChartOfAccountData {
  code: string;
  name: string;
}

export function useChartOfAccounts() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .order("code", { ascending: true });

    if (error) {
      console.error("Error fetching chart of accounts:", error);
      toast.error("Erro ao carregar plano de contas");
    } else {
      setAccounts((data || []).map(mapRow));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = useCallback(async (data: AddChartOfAccountData) => {
    const code = data.code.trim();
    const name = data.name.trim();
    if (!code || !name) return null;

    const { data: inserted, error } = await supabase
      .from("chart_of_accounts")
      .insert({ code, name })
      .select()
      .single();

    if (error) {
      console.error("Error adding chart of account:", error);
      toast.error(
        error.message.includes("duplicate")
          ? "Já existe uma conta com este código"
          : "Erro ao adicionar conta"
      );
      return null;
    }

    const newAccount = mapRow(inserted);
    setAccounts((prev) => [...prev, newAccount].sort((a, b) => a.code.localeCompare(b.code)));
    return newAccount;
  }, []);

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Pick<ChartOfAccount, "code" | "name" | "status">>) => {
      const row: Record<string, unknown> = {};
      if (updates.code !== undefined) row.code = updates.code.trim();
      if (updates.name !== undefined) row.name = updates.name.trim();
      if (updates.status !== undefined) row.status = updates.status;

      const { error } = await supabase.from("chart_of_accounts").update(row).eq("id", id);
      if (error) {
        console.error("Error updating chart of account:", error);
        toast.error("Erro ao atualizar conta");
        return false;
      }

      setAccounts((prev) =>
        prev
          .map((a) => (a.id === id ? { ...a, ...updates } : a))
          .sort((a, b) => a.code.localeCompare(b.code))
      );
      return true;
    },
    []
  );

  const deleteAccount = useCallback(async (id: string) => {
    const { error } = await supabase.from("chart_of_accounts").delete().eq("id", id);
    if (error) {
      console.error("Error deleting chart of account:", error);
      toast.error(
        error.message.includes("fornecedores/colaboradores")
          ? error.message
          : "Não é possível excluir: há cadastros vinculados a esta conta. Inative-a em vez de excluir."
      );
      return false;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    return true;
  }, []);

  return {
    accounts,
    activeAccounts: accounts.filter((a) => a.status === "ativo"),
    isLoading,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
