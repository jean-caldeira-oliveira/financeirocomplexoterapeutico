import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CostCenter } from "@/types/costCenter";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const mapRow = (row: any): CostCenter => ({
  id: row.id,
  name: row.name,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useCostCenters() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchCostCenters = useCallback(async () => {
    if (!user) {
      setCostCenters([]);
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("cost_centers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching cost centers:", error);
      toast.error("Erro ao carregar centros de custo");
    } else {
      setCostCenters((data || []).map(mapRow));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  const addCostCenter = useCallback(async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const { data, error } = await supabase
      .from("cost_centers")
      .insert({ name: trimmedName })
      .select()
      .single();

    if (error) {
      console.error("Error adding cost center:", error);
      toast.error("Erro ao adicionar centro de custo");
      return null;
    }

    const newCostCenter = mapRow(data);
    setCostCenters((prev) =>
      [...prev, newCostCenter].sort((a, b) => a.name.localeCompare(b.name))
    );
    return newCostCenter;
  }, []);

  const updateCostCenter = useCallback(
    async (id: string, updates: Partial<Pick<CostCenter, "name" | "status">>) => {
      const row: Record<string, unknown> = {};
      if (updates.name !== undefined) row.name = updates.name.trim();
      if (updates.status !== undefined) row.status = updates.status;

      const { error } = await supabase.from("cost_centers").update(row).eq("id", id);
      if (error) {
        console.error("Error updating cost center:", error);
        toast.error("Erro ao atualizar centro de custo");
        return false;
      }

      setCostCenters((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, ...updates } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return true;
    },
    []
  );

  const deleteCostCenter = useCallback(async (id: string) => {
    const { error } = await supabase.from("cost_centers").delete().eq("id", id);
    if (error) {
      console.error("Error deleting cost center:", error);
      toast.error(
        error.message.includes("fornecedores/colaboradores")
          ? error.message
          : "Não é possível excluir: há cadastros vinculados a este centro de custo. Inative-o em vez de excluir."
      );
      return false;
    }
    setCostCenters((prev) => prev.filter((c) => c.id !== id));
    return true;
  }, []);

  return {
    costCenters,
    activeCostCenters: costCenters.filter((c) => c.status === "ativo"),
    isLoading,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
  };
}
