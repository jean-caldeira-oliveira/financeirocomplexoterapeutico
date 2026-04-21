import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ReferralSource {
  id: string;
  name: string;
}

export function useReferralSources() {
  const [sources, setSources] = useState<ReferralSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchSources = useCallback(async () => {
    if (!user) { setSources([]); setIsLoading(false); return; }
    const { data, error } = await supabase
      .from('referral_sources')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching referral sources:', error);
    } else {
      setSources((data || []).map((r) => ({ id: r.id, name: r.name })));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const addSource = useCallback(async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    
    const exists = sources.some(
      (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) return null;

    const { data, error } = await supabase
      .from('referral_sources')
      .insert({ user_id: user!.id, name: trimmedName })
      .select()
      .single();

    if (error) {
      console.error('Error adding referral source:', error);
      toast.error('Erro ao adicionar canal');
      return null;
    }

    const newSource: ReferralSource = { id: data.id, name: data.name };
    setSources((prev) => [...prev, newSource].sort((a, b) => a.name.localeCompare(b.name)));
    return newSource;
  }, [user, sources]);

  const updateSource = useCallback(async (id: string, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    
    const exists = sources.some(
      (s) => s.id !== id && s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) return false;

    const { error } = await supabase.from('referral_sources').update({ name: trimmedName }).eq('id', id);
    if (error) {
      console.error('Error updating referral source:', error);
      toast.error('Erro ao atualizar canal');
      return false;
    }

    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: trimmedName } : s)).sort((a, b) => a.name.localeCompare(b.name))
    );
    return true;
  }, [sources]);

  const deleteSource = useCallback(async (id: string) => {
    const { error } = await supabase.from('referral_sources').delete().eq('id', id);
    if (error) {
      console.error('Error deleting referral source:', error);
      toast.error('Erro ao excluir canal');
      return;
    }
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    sources,
    isLoading,
    addSource,
    updateSource,
    deleteSource,
  };
}
