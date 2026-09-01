import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BudgetQuote, RoomPricing, RoomType } from "@/types/budgetQuote";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface NewBudgetQuoteData {
  patientName: string;
  patientDocument?: string;
  patientBirthDate?: string;
  guardianName: string;
  guardianDocument?: string;
  guardianPhone?: string;
  roomPricing: Record<RoomType, RoomPricing>;
  psychiatricFollowup: boolean;
  periodMonths?: string;
  validityDays: number;
  notes?: string;
}

const mapQuoteRow = (row: any): BudgetQuote => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name ?? undefined,
  patientName: row.patient_name,
  patientDocument: row.patient_document ?? undefined,
  patientBirthDate: row.patient_birth_date ?? undefined,
  guardianName: row.guardian_name,
  guardianDocument: row.guardian_document ?? undefined,
  guardianPhone: row.guardian_phone ?? undefined,
  roomPricing: {
    coletivo: {
      enrollmentFee: Number(row.coletivo_enrollment_fee),
      monthlyFee: Number(row.coletivo_monthly_fee),
    },
    semi_privativo: {
      enrollmentFee: Number(row.semi_privativo_enrollment_fee),
      monthlyFee: Number(row.semi_privativo_monthly_fee),
    },
    privativo: {
      enrollmentFee: Number(row.privativo_enrollment_fee),
      monthlyFee: Number(row.privativo_monthly_fee),
    },
  },
  psychiatricFollowup: row.psychiatric_followup,
  periodMonths: row.period_months ?? undefined,
  validityDays: row.validity_days,
  notes: row.notes ?? undefined,
  createdAt: row.created_at,
});

const getUserName = (user: { user_metadata?: { full_name?: string }; email?: string | null } | null) =>
  user?.user_metadata?.full_name ?? user?.email ?? "Usuário";

export function useBudgetQuotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["budget-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(mapQuoteRow);
    },
    enabled: !!user,
  });

  const createQuote = useMutation({
    mutationFn: async (data: NewBudgetQuoteData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: inserted, error } = await supabase
        .from("budget_quotes")
        .insert({
          user_id: user.id,
          user_name: getUserName(user),
          patient_name: data.patientName,
          patient_document: data.patientDocument || null,
          patient_birth_date: data.patientBirthDate || null,
          guardian_name: data.guardianName,
          guardian_document: data.guardianDocument || null,
          guardian_phone: data.guardianPhone || null,
          coletivo_enrollment_fee: data.roomPricing.coletivo.enrollmentFee,
          coletivo_monthly_fee: data.roomPricing.coletivo.monthlyFee,
          semi_privativo_enrollment_fee: data.roomPricing.semi_privativo.enrollmentFee,
          semi_privativo_monthly_fee: data.roomPricing.semi_privativo.monthlyFee,
          privativo_enrollment_fee: data.roomPricing.privativo.enrollmentFee,
          privativo_monthly_fee: data.roomPricing.privativo.monthlyFee,
          psychiatric_followup: data.psychiatricFollowup,
          period_months: data.periodMonths || null,
          validity_days: data.validityDays,
          notes: data.notes || null,
        })
        .select("*")
        .single();

      if (error) throw error;
      return mapQuoteRow(inserted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-quotes"] });
      toast.success("Orçamento salvo com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar orçamento: " + error.message);
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-quotes"] });
      toast.success("Orçamento excluído");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir orçamento: " + error.message);
    },
  });

  return {
    quotes,
    isLoading,
    createQuote,
    deleteQuote,
  };
}
