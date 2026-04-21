import { useState, useEffect, useCallback } from 'react';
import {
  expenseCategoryGroupLabels,
  expenseCategoryGroups,
  expenseCategoryLabels,
} from '@/types/transaction';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CustomCategory {
  id: string;
  group: string;
  groupLabel: string;
  key: string;
  label: string;
}

interface DbRow {
  id: string;
  type: string;
  group_key: string | null;
  key: string;
  label: string;
}

const generateKey = (prefix: string, label: string) =>
  `${prefix}_${label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 20)}_${Date.now().toString(36)}`;

export function useCustomCategories() {
  const [groups, setGroups] = useState<{ key: string; label: string }[]>([]);
  const [subcategories, setSubcategories] = useState<{ groupKey: string; key: string; label: string }[]>([]);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching custom categories:', error);
      return;
    }

    const g: { key: string; label: string }[] = [];
    const s: { groupKey: string; key: string; label: string }[] = [];

    (data || []).forEach((row: any) => {
      if (row.type === 'group') {
        g.push({ key: row.key, label: row.label });
      } else {
        s.push({ groupKey: row.group_key, key: row.key, label: row.label });
      }
    });

    setGroups(g);
    setSubcategories(s);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addGroup = useCallback(async (label: string) => {
    const key = generateKey('cg', label);
    const { error } = await supabase.from('custom_categories').insert({
      user_id: user!.id,
      type: 'group',
      key,
      label,
      group_key: null,
    });
    if (error) {
      console.error('Error adding group:', error);
      toast.error('Erro ao adicionar categoria');
      return '';
    }
    setGroups((prev) => [...prev, { key, label }]);
    return key;
  }, [user]);

  const addSubcategory = useCallback(async (groupKey: string, label: string) => {
    const key = generateKey('cs', label);
    const { error } = await supabase.from('custom_categories').insert({
      user_id: user!.id,
      type: 'subcategory',
      key,
      label,
      group_key: groupKey,
    });
    if (error) {
      console.error('Error adding subcategory:', error);
      toast.error('Erro ao adicionar subcategoria');
      return '';
    }
    setSubcategories((prev) => [...prev, { groupKey, key, label }]);
    return key;
  }, [user]);

  const removeGroup = useCallback(async (key: string) => {
    // Delete group + its subcategories
    const { error: err1 } = await supabase.from('custom_categories').delete().eq('key', key);
    const { error: err2 } = await supabase.from('custom_categories').delete().eq('group_key', key);
    if (err1 || err2) {
      console.error('Error removing group:', err1 || err2);
      toast.error('Erro ao remover categoria');
      return;
    }
    setGroups((prev) => prev.filter((g) => g.key !== key));
    setSubcategories((prev) => prev.filter((s) => s.groupKey !== key));
  }, []);

  const removeSubcategory = useCallback(async (key: string) => {
    const { error } = await supabase.from('custom_categories').delete().eq('key', key);
    if (error) {
      console.error('Error removing subcategory:', error);
      toast.error('Erro ao remover subcategoria');
      return;
    }
    setSubcategories((prev) => prev.filter((s) => s.key !== key));
  }, []);

  // Merged data: built-in + custom
  const allGroupLabels: Record<string, string> = {
    ...expenseCategoryGroupLabels,
    ...Object.fromEntries(groups.map((g) => [g.key, g.label])),
  };

  const allSubcategoryLabels: Record<string, string> = {
    ...expenseCategoryLabels,
    ...Object.fromEntries(subcategories.map((s) => [s.key, s.label])),
  };

  const allGroupSubcategories: Record<string, string[]> = { ...expenseCategoryGroups };
  
  for (const sub of subcategories) {
    if (!allGroupSubcategories[sub.groupKey]) {
      allGroupSubcategories[sub.groupKey] = [];
    }
    allGroupSubcategories[sub.groupKey] = [...(allGroupSubcategories[sub.groupKey] || []), sub.key];
  }

  const allGroups = Object.keys(allGroupLabels);

  return {
    customData: { groups, subcategories },
    addGroup,
    addSubcategory,
    removeGroup,
    removeSubcategory,
    allGroupLabels,
    allSubcategoryLabels,
    allGroupSubcategories,
    allGroups,
  };
}
