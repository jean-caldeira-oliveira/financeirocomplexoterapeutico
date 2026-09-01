import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Employee, EmployeePaymentMethod, EmploymentType } from "@/types/employee";
import { onlyDigits } from "@/utils/documentValidation";
import { writeAuditLog } from "@/utils/auditLog";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface EmployeeFormData {
  fullName: string;
  document: string;
  employmentType: EmploymentType;
  roleTitle: string;
  costCenterId: string;
  defaultAccountId: string;
  admissionDate: Date;
  paymentMethod?: EmployeePaymentMethod;
  bankInfoOrPixKey?: string;
  notes?: string;
}

const mapRow = (row: any): Employee => ({
  id: row.id,
  code: row.code,
  fullName: row.full_name,
  document: row.document,
  employmentType: row.employment_type,
  roleTitle: row.role_title,
  costCenterId: row.cost_center_id,
  defaultAccountId: row.default_account_id,
  admissionDate: row.admission_date,
  terminationDate: row.termination_date ?? undefined,
  status: row.status,
  paymentMethod: row.payment_method ?? undefined,
  bankInfoOrPixKey: row.bank_info_or_pix_key ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchEmployees = useCallback(async () => {
    if (!user) {
      setEmployees([]);
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Erro ao carregar colaboradores");
    } else {
      setEmployees((data || []).map(mapRow));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = useCallback(
    async (data: EmployeeFormData): Promise<Employee> => {
      const row = {
        full_name: data.fullName,
        document: onlyDigits(data.document),
        employment_type: data.employmentType,
        role_title: data.roleTitle,
        cost_center_id: data.costCenterId,
        default_account_id: data.defaultAccountId,
        admission_date: data.admissionDate.toISOString().slice(0, 10),
        payment_method: data.paymentMethod || null,
        bank_info_or_pix_key: data.bankInfoOrPixKey || null,
        notes: data.notes || null,
      };

      const { data: inserted, error } = await supabase
        .from("employees")
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error("Error adding employee:", error);
        toast.error(
          error.message.includes("duplicate")
            ? "Já existe um colaborador cadastrado com este CPF"
            : "Erro ao adicionar colaborador"
        );
        throw error;
      }

      const newEmployee = mapRow(inserted);
      setEmployees((prev) => [newEmployee, ...prev]);

      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "colaboradores",
        action: "criar",
        description: `Colaborador criado: "${data.fullName}"`,
        entityName: data.fullName,
        entityId: newEmployee.id,
      });

      return newEmployee;
    },
    [user]
  );

  const updateEmployee = useCallback(
    async (id: string, data: EmployeeFormData) => {
      const row = {
        full_name: data.fullName,
        document: onlyDigits(data.document),
        employment_type: data.employmentType,
        role_title: data.roleTitle,
        cost_center_id: data.costCenterId,
        default_account_id: data.defaultAccountId,
        admission_date: data.admissionDate.toISOString().slice(0, 10),
        payment_method: data.paymentMethod || null,
        bank_info_or_pix_key: data.bankInfoOrPixKey || null,
        notes: data.notes || null,
      };

      const { error } = await supabase.from("employees").update(row).eq("id", id);
      if (error) {
        console.error("Error updating employee:", error);
        toast.error(
          error.message.includes("duplicate")
            ? "Já existe um colaborador cadastrado com este CPF"
            : "Erro ao atualizar colaborador"
        );
        return false;
      }

      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "colaboradores",
        action: "editar",
        description: `Colaborador editado: "${data.fullName}"`,
        entityName: data.fullName,
        entityId: id,
      });

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                fullName: data.fullName,
                document: onlyDigits(data.document),
                employmentType: data.employmentType,
                roleTitle: data.roleTitle,
                costCenterId: data.costCenterId,
                defaultAccountId: data.defaultAccountId,
                admissionDate: data.admissionDate.toISOString().slice(0, 10),
                paymentMethod: data.paymentMethod,
                bankInfoOrPixKey: data.bankInfoOrPixKey,
                notes: data.notes,
              }
            : e
        )
      );
      return true;
    },
    [user]
  );

  // Status "desligado" exige data de desligamento (regra do banco);
  // "ativo"/"inativo" limpam a data de desligamento.
  const setEmployeeStatus = useCallback(
    async (id: string, status: "ativo" | "inativo" | "desligado", terminationDate?: Date) => {
      const employee = employees.find((e) => e.id === id);
      if (!employee) return;

      const row: Record<string, unknown> = { status };
      row.termination_date =
        status === "desligado"
          ? (terminationDate ?? new Date()).toISOString().slice(0, 10)
          : null;

      const { error } = await supabase.from("employees").update(row).eq("id", id);
      if (error) {
        console.error("Error updating employee status:", error);
        toast.error("Erro ao atualizar status do colaborador");
        return;
      }

      const actionLabel =
        status === "ativo" ? "ativar" : status === "inativo" ? "desativar" : "editar";
      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "colaboradores",
        action: actionLabel,
        description: `Colaborador ${status === "desligado" ? "desligado" : status === "ativo" ? "ativado" : "desativado"}: "${employee.fullName}"`,
        entityName: employee.fullName,
        entityId: id,
      });

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                terminationDate: row.termination_date as string | undefined,
              }
            : e
        )
      );
    },
    [employees, user]
  );

  const deleteEmployee = useCallback(
    async (id: string) => {
      const employee = employees.find((e) => e.id === id);
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) {
        console.error("Error deleting employee:", error);
        toast.error(
          error.message.includes("lançamentos vinculados")
            ? error.message
            : "Erro ao excluir colaborador"
        );
        return false;
      }
      setEmployees((prev) => prev.filter((e) => e.id !== id));

      await writeAuditLog({
        userId: user!.id,
        userName: user!.user_metadata?.full_name ?? user!.email ?? "Usuário",
        userEmail: user!.email ?? undefined,
        module: "colaboradores",
        action: "excluir",
        description: `Colaborador excluído: "${employee?.fullName ?? id}"`,
        entityName: employee?.fullName,
        entityId: id,
      });
      return true;
    },
    [employees, user]
  );

  return {
    employees,
    activeEmployees: employees.filter((e) => e.status === "ativo"),
    isLoading,
    addEmployee,
    updateEmployee,
    setEmployeeStatus,
    deleteEmployee,
  };
}
