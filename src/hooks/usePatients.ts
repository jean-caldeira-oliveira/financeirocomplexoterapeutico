import { useState, useEffect, useCallback } from 'react';
import { Patient, Ward } from '@/types/transaction';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AddPatientData {
  name: string;
  entryDate: Date;
  dueDay: number;
  monthlyFee: number;
  installments: number;
  hasEnrollmentFee: boolean;
  enrollmentFee: number;
  enrollmentDueDate?: Date;
  firstInstallmentDate?: Date;
  guardianName: string;
  guardianContact: string;
  ward: Ward;
  referralSource: string;
  interestRateMonthly: number;
}

// Map DB row to Patient type
const mapRow = (row: any): Patient => ({
  id: row.id,
  name: row.name,
  entryDate: row.entry_date,
  dueDay: row.due_day,
  monthlyFee: Number(row.monthly_fee),
  installments: row.installments,
  hasEnrollmentFee: row.has_enrollment_fee,
  enrollmentFee: Number(row.enrollment_fee),
  enrollmentDueDate: row.enrollment_due_date ?? undefined,
  firstInstallmentDate: row.first_installment_date ?? undefined,
  guardianName: row.guardian_name,
  guardianContact: row.guardian_contact,
  ward: row.ward as Ward,
  referralSource: row.referral_source,
  interestRateMonthly: Number(row.interest_rate_monthly),
  active: row.active,
  createdAt: row.created_at,
});

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchPatients = useCallback(async () => {
    if (!user) { setPatients([]); setIsLoading(false); return; }
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patients:', error);
      toast.error('Erro ao carregar pacientes');
    } else {
      setPatients((data || []).map(mapRow));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const addPatient = useCallback(async (data: AddPatientData): Promise<Patient> => {
    const row = {
      user_id: user!.id,
      name: data.name,
      entry_date: data.entryDate.toISOString(),
      due_day: data.dueDay,
      monthly_fee: data.monthlyFee,
      installments: data.installments,
      has_enrollment_fee: data.hasEnrollmentFee,
      enrollment_fee: data.enrollmentFee,
      enrollment_due_date: data.enrollmentDueDate?.toISOString() ?? null,
      first_installment_date: data.firstInstallmentDate?.toISOString() ?? null,
      guardian_name: data.guardianName,
      guardian_contact: data.guardianContact,
      ward: data.ward,
      referral_source: data.referralSource,
      interest_rate_monthly: data.interestRateMonthly,
      active: true,
    };

    const { data: inserted, error } = await supabase
      .from('patients')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Error adding patient:', error);
      toast.error('Erro ao adicionar paciente');
      throw error;
    }

    const newPatient = mapRow(inserted);
    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  }, [user]);

  const updatePatient = useCallback(async (id: string, data: Partial<AddPatientData>) => {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.entryDate !== undefined) updates.entry_date = data.entryDate.toISOString();
    if (data.dueDay !== undefined) updates.due_day = data.dueDay;
    if (data.monthlyFee !== undefined) updates.monthly_fee = data.monthlyFee;
    if (data.installments !== undefined) updates.installments = data.installments;
    if (data.hasEnrollmentFee !== undefined) updates.has_enrollment_fee = data.hasEnrollmentFee;
    if (data.enrollmentFee !== undefined) updates.enrollment_fee = data.enrollmentFee;
    if (data.enrollmentDueDate !== undefined) updates.enrollment_due_date = data.enrollmentDueDate?.toISOString() ?? null;
    if (data.firstInstallmentDate !== undefined) updates.first_installment_date = data.firstInstallmentDate?.toISOString() ?? null;
    if (data.guardianName !== undefined) updates.guardian_name = data.guardianName;
    if (data.guardianContact !== undefined) updates.guardian_contact = data.guardianContact;
    if (data.ward !== undefined) updates.ward = data.ward;
    if (data.referralSource !== undefined) updates.referral_source = data.referralSource;
    if (data.interestRateMonthly !== undefined) updates.interest_rate_monthly = data.interestRateMonthly;

    const { error } = await supabase.from('patients').update(updates).eq('id', id);

    if (error) {
      console.error('Error updating patient:', error);
      toast.error('Erro ao atualizar paciente');
      return;
    }

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          ...data,
          entryDate: data.entryDate ? data.entryDate.toISOString() : p.entryDate,
          enrollmentDueDate: data.enrollmentDueDate ? data.enrollmentDueDate.toISOString() : p.enrollmentDueDate,
          firstInstallmentDate: data.firstInstallmentDate ? data.firstInstallmentDate.toISOString() : p.firstInstallmentDate,
          dueDay: data.dueDay !== undefined ? data.dueDay : p.dueDay,
        };
      })
    );
  }, []);

  const togglePatientActive = useCallback(async (id: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    const { error } = await supabase.from('patients').update({ active: !patient.active }).eq('id', id);
    if (error) {
      console.error('Error toggling patient:', error);
      toast.error('Erro ao atualizar paciente');
      return;
    }

    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  }, [patients]);

  const deletePatient = useCallback(async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) {
      console.error('Error deleting patient:', error);
      toast.error('Erro ao excluir paciente');
      return;
    }
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPatientById = useCallback((id: string) => {
    return patients.find((p) => p.id === id);
  }, [patients]);

  const activePatients = patients.filter((p) => p.active);
  const inactivePatients = patients.filter((p) => !p.active);
  
  const patientsByWard = {
    feminina: activePatients.filter((p) => p.ward === 'feminina').length,
    masculina: activePatients.filter((p) => p.ward === 'masculina').length,
  };

  return {
    patients,
    activePatients,
    inactivePatients,
    patientsByWard,
    isLoading,
    addPatient,
    updatePatient,
    togglePatientActive,
    deletePatient,
    getPatientById,
  };
}
