import logo from "@/assets/logo.png";
import { MonthSelector } from "@/components/MonthSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3,
  FileText,
  LogOut,
  Receipt,
  ScrollText,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

// ── Label maps ────────────────────────────────────────────────────────────────

const moduleLabels: Record<string, string> = {
  pacientes: "Pacientes",
  cobrancas: "Cobranças",
  contas: "Contas",
  transacoes: "Transações",
  admin: "Admin",
  sistema: "Sistema",
};

const actionLabels: Record<string, string> = {
  criar: "Criar",
  editar: "Editar",
  excluir: "Excluir",
  pagar: "Pagar",
  pagamento_parcial: "Pagamento Parcial",
  reverter_pagamento: "Reverter Pagamento",
  ativar: "Ativar",
  desativar: "Desativar",
  login: "Login",
  logout: "Logout",
};

const actionVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  criar: "default",
  editar: "secondary",
  excluir: "destructive",
  pagar: "default",
  pagamento_parcial: "secondary",
  reverter_pagamento: "outline",
  ativar: "default",
  desativar: "outline",
  login: "secondary",
  logout: "outline",
};

const moduleVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pacientes: "default",
  cobrancas: "secondary",
  contas: "outline",
  transacoes: "secondary",
  admin: "destructive",
  sistema: "outline",
};

// ── Component ─────────────────────────────────────────────────────────────────

const AuditLog = () => {
  const { signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("todos");
  const [actionFilter, setActionFilter] = useState<string>("todos");

  const { logs, isLoading } = useAuditLog(selectedMonth);

  // Redirect non-admins
  if (!adminLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesModule =
        moduleFilter === "todos" || log.appModule === moduleFilter;
      const matchesAction =
        actionFilter === "todos" || log.appAction === actionFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (log.appDescription ?? "").toLowerCase().includes(q) ||
        (log.appUserName ?? "").toLowerCase().includes(q) ||
        (log.appUserEmail ?? "").toLowerCase().includes(q) ||
        (log.appEntityName ?? "").toLowerCase().includes(q) ||
        (log.appEntityId ?? "").toLowerCase().includes(q) ||
        (log.tableName ?? "").toLowerCase().includes(q);
      return matchesModule && matchesAction && matchesSearch;
    });
  }, [logs, moduleFilter, actionFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Complexo Terapêutico"
              className="h-12 w-auto"
              width="48"
              height="48"
            />
            <div>
              <h1 className="text-lg font-bold">CONTROLE DE CAIXA</h1>
              <p className="text-xs text-muted-foreground">
                COMPLEXO TERAPÊUTICO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/pacientes">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Pacientes
              </Button>
            </Link>
            <Link to="/cobrancas">
              <Button variant="outline" size="sm" className="gap-2">
                <Receipt className="h-4 w-4" />
                Cobranças
              </Button>
            </Link>
            <Link to="/contas">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Contas
              </Button>
            </Link>
            <Link to="/relatorios">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Relatórios
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-2 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-6 flex items-center gap-3">
          <ScrollText className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Log de Auditoria</h2>
            <p className="text-sm text-muted-foreground">
              Histórico imutável de todas as ações realizadas no sistema.
              Somente leitura — nenhuma linha pode ser editada ou excluída.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
          />

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, usuário, entidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os módulos</SelectItem>
              {Object.entries(moduleLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as ações</SelectItem>
              {Object.entries(actionLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <p className="mb-3 text-sm text-muted-foreground">
          {isLoading
            ? "Carregando..."
            : `${filteredLogs.length} registro${
                filteredLogs.length !== 1 ? "s" : ""
              } encontrado${filteredLogs.length !== 1 ? "s" : ""} em ${format(
                selectedMonth,
                "MMMM 'de' yyyy",
                { locale: ptBR }
              )}`}
        </p>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[160px] whitespace-nowrap">
                    Data / Hora
                  </TableHead>
                  <TableHead className="w-[130px]">Usuário</TableHead>
                  <TableHead className="w-[110px]">Módulo</TableHead>
                  <TableHead className="w-[130px]">Ação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[160px]">Entidade</TableHead>
                  <TableHead className="w-[120px]">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Carregando logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <ScrollText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      Nenhum registro encontrado para o período e filtros
                      selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {format(
                          new Date(log.createdAt),
                          "dd/MM/yyyy HH:mm:ss",
                          { locale: ptBR }
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium leading-tight">
                          {log.appUserName ?? "—"}
                        </div>
                        {log.appUserEmail && (
                          <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {log.appUserEmail}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            moduleVariant[log.appModule ?? ""] ?? "outline"
                          }
                          className="text-xs"
                        >
                          {log.appModule
                            ? moduleLabels[log.appModule] ?? log.appModule
                            : log.tableName ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            actionVariant[log.appAction ?? ""] ?? "outline"
                          }
                          className="text-xs"
                        >
                          {log.appAction
                            ? actionLabels[log.appAction] ?? log.appAction
                            : log.operation ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.appDescription ?? log.tableName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.appEntityName ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.appEntityId ? (
                          <span title={log.appEntityId} className="cursor-help">
                            {log.appEntityId.length > 8
                              ? `${log.appEntityId.slice(0, 8)}…`
                              : log.appEntityId}
                          </span>
                        ) : log.recordId ? (
                          <span title={log.recordId} className="cursor-help">
                            {log.recordId.length > 8
                              ? `${log.recordId.slice(0, 8)}…`
                              : log.recordId}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          🔒 Esta tabela é somente leitura. Nenhum registro pode ser editado ou
          excluído — é o histórico oficial do sistema para fins de auditoria.
        </p>
      </main>
    </div>
  );
};

export default AuditLog;
