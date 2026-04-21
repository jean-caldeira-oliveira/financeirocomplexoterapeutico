import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable } from '@/components/admin/UserTable';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAdminUsers } from '@/hooks/useAdminUsers';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { users, isLoading: usersLoading, error, updateRole, deleteUser, createUser } = useAdminUsers();

  // Wait for both auth and admin status to be determined
  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only redirect if admin check completed and user is not admin
  if (!adminLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Painel de Administração</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                </div>
                <CardDescription className="mt-1.5">
                  Visualize e gerencie todos os usuários do sistema
                </CardDescription>
              </div>
              <CreateUserDialog
                onCreateUser={(data) => createUser.mutate(data)}
                isCreating={createUser.isPending}
              />
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <p>Erro ao carregar usuários: {(error as Error).message}</p>
              </div>
            ) : users && users.length > 0 ? (
              <UserTable
                users={users}
                currentUserId={user.id}
                onUpdateRole={(userId, role, action) => updateRole.mutate({ userId, role, action })}
                onDeleteUser={(userId) => deleteUser.mutate(userId)}
                isUpdating={updateRole.isPending}
                isDeleting={deleteUser.isPending}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
