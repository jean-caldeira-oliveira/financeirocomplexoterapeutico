import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shield, ShieldOff, Trash2, User, UserCheck, MoreHorizontal, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminUser } from '@/hooks/useAdminUsers';

interface UserTableProps {
  users: AdminUser[];
  currentUserId: string;
  onUpdateRole: (userId: string, role: string, action: 'add' | 'remove') => void;
  onDeleteUser: (userId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function UserTable({ 
  users, 
  currentUserId, 
  onUpdateRole, 
  onDeleteUser,
  isUpdating,
  isDeleting 
}: UserTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'admin' && user.roles.includes('admin')) ||
        (roleFilter === 'user' && !user.roles.includes('admin'));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && user.email_confirmed) ||
        (statusFilter === 'pending' && !user.email_confirmed);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleDelete = (userId: string) => {
    onDeleteUser(userId);
    setDeleteConfirm(null);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Usuário</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="verified">Verificado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum usuário encontrado com os filtros aplicados</p>
        </div>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead className="w-[70px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const isAdmin = user.roles.includes('admin');
            
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.full_name || 'Sem nome'}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {user.email_confirmed ? (
                    <Badge variant="default" className="bg-green-500">
                      <UserCheck className="mr-1 h-3 w-3" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="mr-1 h-3 w-3" />
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.length === 0 ? (
                      <Badge variant="outline">user</Badge>
                    ) : (
                      user.roles.map((role) => (
                        <Badge 
                          key={role} 
                          variant={role === 'admin' ? 'default' : 'outline'}
                        >
                          {role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                          {role}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {user.last_sign_in_at 
                    ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : 'Nunca'
                  }
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isUpdating || isDeleting}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isAdmin ? (
                        <DropdownMenuItem
                          onClick={() => onUpdateRole(user.id, 'admin', 'remove')}
                          disabled={isCurrentUser}
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Remover Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onUpdateRole(user.id, 'admin', 'add')}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Tornar Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirm(user.id)}
                        disabled={isCurrentUser}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Usuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário será permanentemente excluído do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
