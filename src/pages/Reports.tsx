import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, FileText, Receipt, Download, TrendingUp, TrendingDown, Clock, CalendarIcon, CreditCard, FileDown } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MonthSelector } from '@/components/MonthSelector';
import { usePatients } from '@/hooks/usePatients';
import { useBills } from '@/hooks/useBills';
import { useTransactions } from '@/hooks/useTransactions';
import { useInvoices } from '@/hooks/useInvoices';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { categoryLabels, wardLabels } from '@/types/transaction';
import { billStatusLabels, billRecurrenceLabels, billPaymentMethodLabels, BillPaymentMethod } from '@/types/bill';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { invoiceStatusLabels, invoicePaymentMethodLabels, InvoicePaymentMethod } from '@/types/invoice';
import { cn } from '@/lib/utils';
import { exportPatientsPDF, exportInvoicesPDF, exportBillsPDF, exportTransactionsPDF } from '@/utils/exportReportPDF';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { patients, activePatients, inactivePatients, patientsByWard } = usePatients();
  const { bills, stats: billStats, getBillsByMonth } = useBills();
  const { transactions, allTransactions, stats: txStats } = useTransactions(selectedMonth);
  const { invoices, getInvoicePaidAmount, getInvoiceRemainingAmount } = useInvoices();
  const { isAdmin } = useIsAdmin();
  const { users } = useAdminUsers();
  const { allGroupLabels, allSubcategoryLabels, allGroupSubcategories } = useCustomCategories();

  // Invoice report filters
  const [invDueDayFrom, setInvDueDayFrom] = useState<string>('');
  const [invDueDayTo, setInvDueDayTo] = useState<string>('');
  const [invWardFilter, setInvWardFilter] = useState<string>('all');
  const [invStatusFilter, setInvStatusFilter] = useState<string>('all');
  const [invPaymentDateFrom, setInvPaymentDateFrom] = useState<Date | undefined>(undefined);
  const [invPaymentDateTo, setInvPaymentDateTo] = useState<Date | undefined>(undefined);
  const [invPaymentMethodFilter, setInvPaymentMethodFilter] = useState<string>('all');

  // Bill report filters
  const [billDueDayFrom, setBillDueDayFrom] = useState<string>('');
  const [billDueDayTo, setBillDueDayTo] = useState<string>('');
  const [billCategoryFilter, setBillCategoryFilter] = useState<string>('all');
  const [billSubcategoryFilter, setBillSubcategoryFilter] = useState<string>('all');
  const [billStatusFilter, setBillStatusFilter] = useState<string>('all');
  const [billPaymentMethodFilter, setBillPaymentMethodFilter] = useState<string>('all');

  const monthBills = useMemo(() => {
    return getBillsByMonth(selectedMonth.getFullYear(), selectedMonth.getMonth());
  }, [selectedMonth, getBillsByMonth]);

  const filteredMonthBills = useMemo(() => {
    return monthBills.filter((b) => {
      const dueDate = new Date(b.dueDate);
      const dueDay = dueDate.getDate();
      if (billDueDayFrom && dueDay < Number(billDueDayFrom)) return false;
      if (billDueDayTo && dueDay > Number(billDueDayTo)) return false;
      if (billCategoryFilter !== 'all' && b.category !== billCategoryFilter) return false;
      if (billSubcategoryFilter !== 'all' && b.subcategory !== billSubcategoryFilter) return false;
      if (billStatusFilter !== 'all' && b.status !== billStatusFilter) return false;
      if (billPaymentMethodFilter !== 'all' && b.paymentMethod !== billPaymentMethodFilter) return false;
      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [monthBills, billDueDayFrom, billDueDayTo, billCategoryFilter, billSubcategoryFilter, billStatusFilter, billPaymentMethodFilter]);

  const monthLabel = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });

  // Patient stats
  const patientStats = useMemo(() => {
    const byReferral: Record<string, number> = {};
    activePatients.forEach((p) => {
      const src = p.referralSource || 'Não informado';
      byReferral[src] = (byReferral[src] || 0) + 1;
    });

    const totalMonthlyRevenue = activePatients.reduce((sum, p) => sum + p.monthlyFee, 0);
    const avgMonthlyFee = activePatients.length > 0 ? totalMonthlyRevenue / activePatients.length : 0;

    return { byReferral, totalMonthlyRevenue, avgMonthlyFee };
  }, [activePatients]);

  // Build patient ward map
  const patientWardMap = useMemo(() => {
    const map: Record<string, string> = {};
    patients.forEach((p) => { map[p.id] = p.ward; });
    return map;
  }, [patients]);

  // Filtered invoices for report
  const filteredReportInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      const dueDay = dueDate.getDate();

      // Due day range
      if (invDueDayFrom && dueDay < Number(invDueDayFrom)) return false;
      if (invDueDayTo && dueDay > Number(invDueDayTo)) return false;

      // Ward filter
      if (invWardFilter !== 'all') {
        const ward = patientWardMap[inv.patientId];
        if (ward !== invWardFilter) return false;
      }

      // Status filter
      if (invStatusFilter !== 'all' && inv.status !== invStatusFilter) return false;

      // Payment method filter
      if (invPaymentMethodFilter !== 'all') {
        const payments = inv.payments ?? [];
        if (!payments.some((p) => p.method === invPaymentMethodFilter)) return false;
      }

      // Payment date range
      if (invPaymentDateFrom || invPaymentDateTo) {
        const payments = inv.payments ?? [];
        if (payments.length === 0) return false;
        const hasMatchingPayment = payments.some((p) => {
          const pDate = startOfDay(new Date(p.paymentDate));
          if (invPaymentDateFrom && pDate < startOfDay(invPaymentDateFrom)) return false;
          if (invPaymentDateTo && pDate > startOfDay(invPaymentDateTo)) return false;
          return true;
        });
        if (!hasMatchingPayment) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [invoices, invDueDayFrom, invDueDayTo, invWardFilter, invStatusFilter, invPaymentDateFrom, invPaymentDateTo, invPaymentMethodFilter, patientWardMap]);

  const invoiceReportTotals = useMemo(() => {
    const total = filteredReportInvoices.reduce((s, i) => s + i.amount, 0);
    const received = filteredReportInvoices.reduce((s, i) => s + getInvoicePaidAmount(i), 0);
    const pending = filteredReportInvoices.reduce((s, i) => s + getInvoiceRemainingAmount(i), 0);
    return { total, received, pending, count: filteredReportInvoices.length };
  }, [filteredReportInvoices, getInvoicePaidAmount, getInvoiceRemainingAmount]);

  // Bill stats for month
  const monthBillStats = useMemo(() => {
    const paid = filteredMonthBills.filter((b) => b.status === 'paid');
    const pending = filteredMonthBills.filter((b) => b.status === 'pending');
    const overdue = filteredMonthBills.filter((b) => b.status === 'overdue');

    const byCategory: Record<string, number> = {};
    filteredMonthBills.forEach((b) => {
      const cat = allGroupLabels[b.category] || b.category || 'Outros';
      byCategory[cat] = (byCategory[cat] || 0) + (b.status === 'paid' ? (b.paidAmount ?? b.amount) : b.amount);
    });

    return {
      total: filteredMonthBills.reduce((s, b) => s + (b.status === 'paid' ? (b.paidAmount ?? b.amount) : b.amount), 0),
      paidTotal: paid.reduce((s, b) => s + (b.paidAmount ?? b.amount), 0),
      paidCount: paid.length,
      pendingTotal: pending.reduce((s, b) => s + b.amount, 0),
      pendingCount: pending.length,
      overdueTotal: overdue.reduce((s, b) => s + b.amount, 0),
      overdueCount: overdue.length,
      byCategory,
    };
  }, [filteredMonthBills, allGroupLabels]);

  const handleExportCSV = (type: string) => {
    let csvContent = '';
    let filename = '';

    if (type === 'patients') {
      csvContent = 'Nome,Ala,Status,Mensalidade,Dia Vencimento,Responsável,Contato,Canal\n';
      patients.forEach((p) => {
        csvContent += `"${p.name}","${wardLabels[p.ward]}","${p.active ? 'Ativo' : 'Inativo'}","${p.monthlyFee}","${p.dueDay}","${p.guardianName}","${p.guardianContact}","${p.referralSource}"\n`;
      });
      filename = 'relatorio_pacientes.csv';
    } else if (type === 'bills') {
      csvContent = 'Descrição,Valor,Valor Pago,Vencimento,Categoria,Status,Recorrência,Forma Pagamento\n';
      filteredMonthBills.forEach((b) => {
        csvContent += `"${b.description}","${b.amount}","${b.paidAmount ?? ''}","${format(new Date(b.dueDate), 'dd/MM/yyyy')}","${allGroupLabels[b.category] || b.category}","${billStatusLabels[b.status]}","${billRecurrenceLabels[b.recurrence]}","${b.paymentMethod ? billPaymentMethodLabels[b.paymentMethod] : ''}"\n`;
      });
      filename = `relatorio_contas_${format(selectedMonth, 'yyyy-MM')}.csv`;
    } else if (type === 'transactions') {
      csvContent = 'Descrição,Tipo,Categoria,Valor,Data,Status\n';
      transactions.forEach((t) => {
        csvContent += `"${t.description}","${t.type === 'income' ? 'Entrada' : 'Saída'}","${categoryLabels[t.category] || t.category}","${t.amount}","${format(new Date(t.date), 'dd/MM/yyyy')}","${t.status || 'N/A'}"\n`;
      });
      filename = `relatorio_transacoes_${format(selectedMonth, 'yyyy-MM')}.csv`;
    } else if (type === 'invoices') {
      csvContent = 'Paciente,Ala,Parcela,Vencimento,Valor,Recebido,Saldo,Status,Pagamentos\n';
      filteredReportInvoices.forEach((inv) => {
        const ward = patientWardMap[inv.patientId] ? wardLabels[patientWardMap[inv.patientId] as keyof typeof wardLabels] : '-';
        const payments = (inv.payments ?? []).map((p) =>
          `${format(new Date(p.paymentDate), 'dd/MM/yyyy')} ${invoicePaymentMethodLabels[p.method]} ${p.amount.toFixed(2)}${p.isLate ? ' (atraso)' : ''}`
        ).join(' | ');
        csvContent += `"${inv.patientName}","${ward}","${inv.installmentNumber}/${inv.totalInstallments}","${format(new Date(inv.dueDate), 'dd/MM/yyyy')}","${inv.amount}","${getInvoicePaidAmount(inv)}","${getInvoiceRemainingAmount(inv)}","${invoiceStatusLabels[inv.status]}","${payments}"\n`;
      });
      filename = 'relatorio_cobrancas.csv';
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Relatórios</h1>
              </div>
            </div>
            <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="patients" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Pacientes</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Cobranças</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Contas</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Transações</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* PATIENTS TAB */}
          <TabsContent value="patients" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Relatório de Pacientes</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportCSV('patients')}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportPatientsPDF(patients, patientsByWard)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pacientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{patients.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{activePatients.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal Prevista</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(patientStats.totalMonthlyRevenue)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(patientStats.avgMonthlyFee)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Por Ala</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Ala Feminina</span>
                      <Badge variant="secondary">{patientsByWard.feminina} pacientes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ala Masculina</span>
                      <Badge variant="secondary">{patientsByWard.masculina} pacientes</Badge>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <span>Inativos</span>
                      <Badge variant="outline">{inactivePatients.length} pacientes</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Por Canal de Encaminhamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(patientStats.byReferral)
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => (
                        <div key={source} className="flex items-center justify-between">
                          <span className="text-sm">{source}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    {Object.keys(patientStats.byReferral).length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lista de Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Ala</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensalidade</TableHead>
                      <TableHead>Dia Venc.</TableHead>
                      <TableHead>Responsável</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{wardLabels[p.ward]}</TableCell>
                        <TableCell>
                          <Badge variant={p.active ? 'default' : 'secondary'}>
                            {p.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(p.monthlyFee)}</TableCell>
                        <TableCell>{p.dueDay}</TableCell>
                        <TableCell>{p.guardianName || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {patients.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum paciente cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVOICES TAB */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Relatório de Cobranças</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportCSV('invoices')}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportInvoicesPDF({
                  invoices: filteredReportInvoices,
                  totals: invoiceReportTotals,
                  patientWardMap,
                  getInvoicePaidAmount,
                  getInvoiceRemainingAmount,
                })}>
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Due day range */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Dia de vencimento</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="De"
                        value={invDueDayFrom}
                        onChange={(e) => setInvDueDayFrom(e.target.value)}
                        className="w-20"
                      />
                      <span className="text-muted-foreground text-sm">a</span>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Até"
                        value={invDueDayTo}
                        onChange={(e) => setInvDueDayTo(e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>

                  {/* Ward */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Ala</Label>
                    <Select value={invWardFilter} onValueChange={setInvWardFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="feminina">Feminina</SelectItem>
                        <SelectItem value="masculina">Masculina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select value={invStatusFilter} onValueChange={setInvStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="paid">Recebido</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Forma de recebimento</Label>
                    <Select value={invPaymentMethodFilter} onValueChange={setInvPaymentMethodFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {(Object.keys(invoicePaymentMethodLabels) as InvoicePaymentMethod[]).map((m) => (
                          <SelectItem key={m} value={m}>{invoicePaymentMethodLabels[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment date from */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Data pagamento de</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !invPaymentDateFrom && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invPaymentDateFrom ? format(invPaymentDateFrom, 'dd/MM/yyyy') : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={invPaymentDateFrom} onSelect={setInvPaymentDateFrom} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Payment date to */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Data pagamento até</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !invPaymentDateTo && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invPaymentDateTo ? format(invPaymentDateTo, 'dd/MM/yyyy') : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={invPaymentDateTo} onSelect={setInvPaymentDateTo} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Clear filters */}
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setInvDueDayFrom('');
                      setInvDueDayTo('');
                      setInvWardFilter('all');
                      setInvStatusFilter('all');
                      setInvPaymentDateFrom(undefined);
                      setInvPaymentDateTo(undefined);
                      setInvPaymentMethodFilter('all');
                    }}>
                      Limpar filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(invoiceReportTotals.total)}</div>
                  <p className="text-xs text-muted-foreground">{invoiceReportTotals.count} cobranças</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(invoiceReportTotals.received)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saldo em Aberto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatCurrency(invoiceReportTotals.pending)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cobranças ({invoiceReportTotals.count})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Ala</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Recebido</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamentos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReportInvoices.map((inv) => {
                      const ward = patientWardMap[inv.patientId];
                      const payments = inv.payments ?? [];
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.patientName}</TableCell>
                          <TableCell>
                            {ward ? (
                              <Badge variant="secondary" className="text-xs">
                                {wardLabels[ward as keyof typeof wardLabels]}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{inv.installmentNumber}/{inv.totalInstallments}</TableCell>
                          <TableCell>{format(new Date(inv.dueDate), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{formatCurrency(inv.amount)}</TableCell>
                          <TableCell className="text-primary font-medium">{formatCurrency(getInvoicePaidAmount(inv))}</TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(getInvoiceRemainingAmount(inv))}</TableCell>
                          <TableCell>
                            <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                              {invoiceStatusLabels[inv.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payments.length > 0 ? (
                              <div className="space-y-1">
                                {payments.map((p) => (
                                  <div key={p.id} className="text-xs flex items-center gap-1">
                                    <span>{format(new Date(p.paymentDate), 'dd/MM')}</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span>{invoicePaymentMethodLabels[p.method]}</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                                    {p.isLate && <Badge variant="outline" className="text-[10px] px-1 border-red-300 text-red-500">atraso</Badge>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredReportInvoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          Nenhuma cobrança encontrada com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Relatório de Contas — {monthLabel}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportCSV('bills')}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportBillsPDF(filteredMonthBills, monthLabel, monthBillStats)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Dia venc. de</Label>
                    <Input type="number" min="1" max="31" className="w-20" placeholder="1" value={billDueDayFrom} onChange={(e) => setBillDueDayFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Dia venc. até</Label>
                    <Input type="number" min="1" max="31" className="w-20" placeholder="31" value={billDueDayTo} onChange={(e) => setBillDueDayTo(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Categoria</Label>
                    <Select value={billCategoryFilter} onValueChange={(v) => { setBillCategoryFilter(v); setBillSubcategoryFilter('all'); }}>
                      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {Object.entries(allGroupLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {billCategoryFilter !== 'all' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Subcategoria</Label>
                      <Select value={billSubcategoryFilter} onValueChange={setBillSubcategoryFilter}>
                        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {(allGroupSubcategories[billCategoryFilter] || []).map((key) => (
                            <SelectItem key={key} value={key}>{allSubcategoryLabels[key] || key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={billStatusFilter} onValueChange={setBillStatusFilter}>
                      <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="paid">Pagos</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="overdue">Atrasados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Forma Pgto</Label>
                    <Select value={billPaymentMethodFilter} onValueChange={setBillPaymentMethodFilter}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {(Object.keys(billPaymentMethodLabels) as BillPaymentMethod[]).map((m) => (
                          <SelectItem key={m} value={m}>{billPaymentMethodLabels[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className="h-9 px-3">
                    {filteredMonthBills.length} contas
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(monthBillStats.total)}</div>
                  <p className="text-xs text-muted-foreground">{filteredMonthBills.length} contas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Pagas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(monthBillStats.paidTotal)}</div>
                  <p className="text-xs text-muted-foreground">{monthBillStats.paidCount} contas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(monthBillStats.pendingTotal)}</div>
                  <p className="text-xs text-muted-foreground">{monthBillStats.pendingCount} contas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" /> Atrasadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatCurrency(monthBillStats.overdueTotal)}</div>
                  <p className="text-xs text-muted-foreground">{monthBillStats.overdueCount} contas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(monthBillStats.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, total]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-sm">{cat}</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                    ))}
                  {Object.keys(monthBillStats.byCategory).length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma conta no mês</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contas do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMonthBills.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          {b.description}
                          {b.totalInstallments && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({b.installmentNumber}/{b.totalInstallments})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(b.status === 'paid' ? (b.paidAmount ?? b.amount) : b.amount)}
                          {b.paidAmount != null && b.paidAmount !== b.amount && (
                            <div className="text-xs text-muted-foreground">Original: {formatCurrency(b.amount)}</div>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(b.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{allGroupLabels[b.category] || b.category}</TableCell>
                        <TableCell>
                          {b.paymentMethod && (
                            <Badge variant="outline" className="text-xs mr-1">{billPaymentMethodLabels[b.paymentMethod]}</Badge>
                          )}
                          <Badge variant={b.status === 'paid' ? 'default' : b.status === 'overdue' ? 'destructive' : 'secondary'}>
                            {billStatusLabels[b.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredMonthBills.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma conta encontrada com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRANSACTIONS TAB */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Relatório de Transações — {monthLabel}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportCSV('transactions')}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportTransactionsPDF(transactions, monthLabel, txStats)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Previsão de Entradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(txStats.expectedIncome)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Entradas Recebidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(txStats.actualIncome)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatCurrency(txStats.monthExpense)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${txStats.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(txStats.balance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {Object.keys(txStats.expenseByCategory).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saídas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(txStats.expenseByCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, total]) => (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-sm">{categoryLabels[cat as keyof typeof categoryLabels] || cat}</span>
                          <span className="font-medium">{formatCurrency(total)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transações do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === 'income' ? 'default' : 'destructive'}>
                            {t.type === 'income' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell>{categoryLabels[t.category] || t.category}</TableCell>
                        <TableCell>{formatCurrency(t.amount)}</TableCell>
                        <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          {t.status ? (
                            <Badge variant={t.status === 'paid' ? 'default' : t.status === 'overdue' ? 'destructive' : 'secondary'}>
                              {t.status === 'paid' ? 'Pago' : t.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhuma transação neste mês
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS TAB (admin only) */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <h2 className="text-lg font-semibold">Relatório de Usuários</h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {users?.filter((u) => u.roles.includes('admin')).length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Verificados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users?.filter((u) => u.email_confirmed).length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lista de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Último acesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name || 'Sem nome'}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {u.roles.length === 0 ? (
                                <Badge variant="outline">user</Badge>
                              ) : (
                                u.roles.map((r) => (
                                  <Badge key={r} variant={r === 'admin' ? 'default' : 'outline'}>{r}</Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.email_confirmed ? 'default' : 'secondary'}>
                              {u.email_confirmed ? 'Verificado' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(u.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                          <TableCell>
                            {u.last_sign_in_at
                              ? format(new Date(u.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : 'Nunca'}
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
