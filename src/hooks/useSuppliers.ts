import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Supplier, SupplierPersonType } from "@/types/supplier";
import { onlyDigits } from "@/utils/documentValidation";
import { writeAuditLog } from "@/utils/auditLog";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface SupplierFormData {
  personType: SupplierPersonType;
  legalName: string;
  tradeName?: string;
  document: string;
  phone?: string;
  email?: string;
  address?: string;
  bankInfo?: string;
  pixKey?: string;
  defaultAccountId: string;
  defaultCostCenterId: string;
  notes?: string;
}

const mapRow = (row: any): Supplier => ({
  id: row.id,
  code: row.code,
  personType: row.person_type,
  legalName: row.legal_name,
  tradeName: row.trade_name ?? undefined,
  document: row.document,
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  address: row.address ?? undefined,
  bankInfo: row.bank_info ?? undefined,
  pixKey: row.pix_key ?? undefined,
  defaultAccountId: row.default_account_id,
  defaultCostCenterId: row.default_cost_center_id,
  status: row.status,
  notes: row.notes ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchSuppliers = useCallback(async () => {
    if (!user) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Erro ao carregar fornecedores");
    } else {
      setSuppliers((data || []).map(mapRow));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const addSupplier = useCallback(
    async (data: SupplierFormData): Promise<Supplier> => {
      const row = {
        person_type: data.personType,
        legal_name: data.legalName,
        trade_name: data.tradeName || null,
        document: onlyDigits(data.document),
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        bank_info: data.bankInfo || null,
        pix_key: data.pixKey || null,
        default_account_id: data.defaultAccountId,
        default_cost_center_id: data.defaultCostCenterId,
        notes: data.notes || null,
      };

      const { data: inserted, error } = await supabase
        .from("suppliers")
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error("Error adding supplier:", error);
        toast.error(
          error.message.includes("duplicate")
            ? "Já existe um fornecedor cadastrado com este CPF/CNPJ"
            : "Erro ao adicionar fornecedor"
        );
        throw error;
      }

      const newSupplier = mapRow(inserted);
      setSuppliers((prev) => [newSupplier, ...prev]);

      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "fornecedores",
        action: "criar",
        description: `Fornecedor criado: "${data.legalName}"`,
        entityName: data.legalName,
        entityId: newSupplier.id,
      });

      return newSupplier;
    },
    [user]
  );

  const updateSupplier = useCallback(
    async (id: string, data: SupplierFormData) => {
      const row = {
        person_type: data.personType,
        legal_name: data.legalName,
        trade_name: data.tradeName || null,
        document: onlyDigits(data.document),
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        bank_info: data.bankInfo || null,
        pix_key: data.pixKey || null,
        default_account_id: data.defaultAccountId,
        default_cost_center_id: data.defaultCostCenterId,
        notes: data.notes || null,
      };

      const { error } = await supabase.from("suppliers").update(row).eq("id", id);
      if (error) {
        console.error("Error updating supplier:", error);
        toast.error(
          error.message.includes("duplicate")
            ? "Já existe um fornecedor cadastrado com este CPF/CNPJ"
            : "Erro ao atualizar fornecedor"
        );
        return false;
      }

      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "fornecedores",
        action: "editar",
        description: `Fornecedor editado: "${data.legalName}"`,
        entityName: data.legalName,
        entityId: id,
      });

      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                personType: data.personType,
                legalName: data.legalName,
                tradeName: data.tradeName,
                document: onlyDigits(data.document),
                phone: data.phone,
                email: data.email,
                address: data.address,
                bankInfo: data.bankInfo,
                pixKey: data.pixKey,
                defaultAccountId: data.defaultAccountId,
                defaultCostCenterId: data.defaultCostCenterId,
                notes: data.notes,
              }
            : s
        )
      );
      return true;
    },
    [user]
  );

  const toggleSupplierStatus = useCallback(
    async (id: string) => {
      const supplier = suppliers.find((s) => s.id === id);
      if (!supplier) return;
      const newStatus = supplier.status === "ativo" ? "inativo" : "ativo";

      const { error } = await supabase
        .from("suppliers")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) {
        console.error("Error toggling supplier status:", error);
        toast.error("Erro ao atualizar status do fornecedor");
        return;
      }

      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "fornecedores",
        action: newStatus === "ativo" ? "ativar" : "desativar",
        description: `Fornecedor ${newStatus === "ativo" ? "ativado" : "desativado"}: "${supplier.legalName}"`,
        entityName: supplier.legalName,
        entityId: id,
      });

      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    },
    [suppliers, user]
  );

  const deleteSupplier = useCallback(
    async (id: string) => {
      const supplier = suppliers.find((s) => s.id === id);
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) {
        console.error("Error deleting supplier:", error);
        toast.error(
          error.message.includes("lançamentos vinculados")
            ? error.message
            : "Erro ao excluir fornecedor"
        );
        return false;
      }
      setSuppliers((prev) => prev.filter((s) => s.id !== id));

      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "fornecedores",
        action: "excluir",
        description: `Fornecedor excluído: "${supplier?.legalName ?? id}"`,
        entityName: supplier?.legalName,
        entityId: id,
      });
      return true;
    },
    [suppliers, user]
  );

  return {
    suppliers,
    activeSuppliers: suppliers.filter((s) => s.status === "ativo"),
    isLoading,
    addSupplier,
    updateSupplier,
    toggleSupplierStatus,
    deleteSupplier,
  };
}
