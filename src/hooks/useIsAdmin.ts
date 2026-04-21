import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin, isLoading: queryLoading, isFetched } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user
  });

  // Loading is true if auth is still loading, or if we have a user but haven't fetched yet
  const isLoading = authLoading || (!!user && !isFetched);

  return { isAdmin: isAdmin ?? false, isLoading };
}
