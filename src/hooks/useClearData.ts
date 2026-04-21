import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useClearData() {
  const clearAllData = useCallback(async () => {
    try {
      // Delete in order respecting foreign keys
      await supabase.from('invoice_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('referral_sources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('custom_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Also clean localStorage remnants
      ['clinic-cash-invoices', 'clinic-cash-patients', 'clinic-cash-transactions', 'clinic-cash-referral-sources', 'clinic-cash-bills', 'clinic-custom-categories'].forEach((key) => {
        localStorage.removeItem(key);
      });

      toast.success('Dados de teste removidos com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Erro ao limpar dados');
    }
  }, []);

  return { clearAllData };
}
