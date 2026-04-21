import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string;
  roles: string[];
  email_confirmed: boolean;
}

export function useAdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);
      
      return response.data.users as AdminUser[];
    }
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: string; action: 'add' | 'remove' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('update-user-role', {
        body: { userId, role, action },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Sucesso',
        description: 'Role atualizada com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const createUser = useMutation({
    mutationFn: async (data: { email: string; password: string; fullName: string; role: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('create-user', {
        body: data,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    users,
    isLoading,
    error,
    updateRole,
    deleteUser,
    createUser
  };
}
