import { useState, useMemo, Fragment, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Receipt,
  Filter,
  Check,
  Clock,
  AlertTriangle,
  Undo2,
  Star,
  Trash2,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  CalendarClock,
  MessageCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInvoices } from '@/hooks/useInvoices';
import { usePatients } from '@/hooks/usePatients';
import { useClearData } from '@/hooks/useClearData';
import { ReceivePaymentDialog } from '@/components/invoices/ReceivePaymentDialog';
import { CreateExtraInvoiceDialog } from '@/components/invoices/CreateExtraInvoiceDialog';
import { InvoiceStatus, InvoiceType, invoiceStatusLabels, invoiceTypeLabels, invoicePaymentMethodLabels, extraInvoiceTypes, billingMethodLabels } from '@/types/invoice';




const Invoices = () => {
  const { invoices, stats, addPayment, markAsPending, createExtraInvoice, getInvoicePaidAmount, getInvoiceRemainingAmount, getInvoiceInterest, getInvoiceTotalDue } = useInvoices();
  const { patients } = usePatients();
  const { clearAllData } = useClearData();
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedInvoices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);

  const toggleFilter = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  
  // Month filter
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`
  );

  // Generate month options (12 months back and 12 forward)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = -12; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`,
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return options;
  }, []);

  const filteredInvoices = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    
    return invoices.filter((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const monthMatch = dueDate.getFullYear() === year && dueDate.getMonth() === month;
      const statusMatch = statusFilters.length === 0 || statusFilters.includes(invoice.status);
      const typeMatch = typeFilters.length === 0 || typeFilters.includes(invoice.type);
      return monthMatch && statusMatch && typeMatch;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [invoices, selectedMonth, statusFilters, typeFilters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-white">
            <Check className="h-3 w-3" />
            {invoiceStatusLabels[status]}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white">
            <Clock className="h-3 w-3" />
            {invoiceStatusLabels[status]}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="gap-1 bg-red-500 hover:bg-red-600 text-white">
            <AlertTriangle className="h-3 w-3" />
            {invoiceStatusLabels[status]}
          </Badge>
        );
    }
  };

  // Calculate totals for current filter
  const filteredTotals = useMemo(() => {
    const paid = filteredInvoices.filter((i) => i.status === 'paid');
    const pending = filteredInvoices.filter((i) => i.status === 'pending');
    const overdue = filteredInvoices.filter((i) => i.status === 'overdue');
    
    return {
      paid: paid.reduce((sum, i) => sum + getInvoicePaidAmount(i), 0),
      pending: pending.reduce((sum, i) => sum + getInvoiceRemainingAmount(i), 0),
      overdue: overdue.reduce((sum, i) => sum + getInvoiceRemainingAmount(i), 0),
    };
  }, [filteredInvoices, getInvoicePaidAmount, getInvoiceRemainingAmount]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Cobranças</h1>
              <p className="text-xs text-muted-foreground">Gestão de Mensalidades</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreateExtraInvoiceDialog
              patients={patients.map((p) => ({ id: p.id, name: p.name }))}
              onSubmit={createExtraInvoice}
            />
            <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={clearAllData}>
              <Trash2 className="h-4 w-4" />
              Limpar Testes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              Recebido
            </div>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(filteredTotals.paid)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pendente
            </div>
            <p className="mt-1 text-2xl font-bold text-yellow-600">
              {formatCurrency(filteredTotals.pending)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Atrasado
            </div>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {formatCurrency(filteredTotals.overdue)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-between">
                  {statusFilters.length === 0 ? 'Todos Status' : `${statusFilters.length} selecionado(s)`}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                {[
                  { value: 'paid', label: 'Recebidos' },
                  { value: 'pending', label: 'Pendentes' },
                  { value: 'overdue', label: 'Atrasados' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <Checkbox
                      checked={statusFilters.includes(opt.value)}
                      onCheckedChange={() => setStatusFilters((prev) => toggleFilter(prev, opt.value))}
                    />
                    {opt.label}
                  </label>
                ))}
                {statusFilters.length > 0 && (
                  <Button variant="ghost" size="sm" className="mt-1 w-full text-xs" onClick={() => setStatusFilters([])}>
                    <X className="mr-1 h-3 w-3" /> Limpar
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  {typeFilters.length === 0 ? 'Todos Tipos' : `${typeFilters.length} selecionado(s)`}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-2" align="start">
                {[
                  { value: 'enrollment', label: 'Adesão' },
                  { value: 'monthly', label: 'Mensalidade' },
                  { value: 'contract_break', label: 'Quebra de Contrato' },
                  { value: 'damage', label: 'Danos/Ressarcimento' },
                  { value: 'extra_service', label: 'Serviço Avulso' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <Checkbox
                      checked={typeFilters.includes(opt.value)}
                      onCheckedChange={() => setTypeFilters((prev) => toggleFilter(prev, opt.value))}
                    />
                    {opt.label}
                  </label>
                ))}
                {typeFilters.length > 0 && (
                  <Button variant="ghost" size="sm" className="mt-1 w-full text-xs" onClick={() => setTypeFilters([])}>
                    <X className="mr-1 h-3 w-3" /> Limpar
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <Badge variant="outline" className="gap-2 py-2">
            <span className="font-normal text-muted-foreground">Total no mês:</span>
            <span className="font-bold">{filteredInvoices.length} cobranças</span>
          </Badge>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhuma cobrança encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente ajustar os filtros ou cadastre novos pacientes
              </p>
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-8"></TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Recebido / Saldo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const payments = invoice.payments ?? [];
                    const isExpanded = expandedInvoices.has(invoice.id);
                    const hasPayments = payments.length > 0;

                    return (
                      <Fragment key={invoice.id}>
                        <TableRow className={hasPayments ? 'cursor-pointer' : ''} onClick={() => hasPayments && toggleExpanded(invoice.id)}>
                          <TableCell className="w-8 px-2">
                            {hasPayments && (
                              isExpanded
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{invoice.patientName}</span>
                              {invoice.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{invoice.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {invoice.installmentNumber}/{invoice.totalInstallments}
                              {invoice.type === 'enrollment' && (
                                <Badge className="gap-1 bg-purple-500 hover:bg-purple-600 text-white text-xs">
                                  <Star className="h-3 w-3" />
                                  Adesão
                                </Badge>
                              )}
                              {extraInvoiceTypes.includes(invoice.type) && (
                                <Badge className="gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs">
                                  {invoiceTypeLabels[invoice.type]}
                                </Badge>
                              )}
                              {invoice.billingMethod && (
                                <Badge variant="outline" className="text-xs">
                                  {billingMethodLabels[invoice.billingMethod] || invoice.billingMethod}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <p>Recebido: {formatCurrency(getInvoicePaidAmount(invoice))}</p>
                              <p className="text-muted-foreground">Saldo: {formatCurrency(getInvoiceRemainingAmount(invoice))}</p>
                              {getInvoiceInterest(invoice) > 0 && (
                                <p className="text-red-500 font-medium">
                                  Juros: {formatCurrency(getInvoiceInterest(invoice))}
                                </p>
                              )}
                              {getInvoiceInterest(invoice) > 0 && (
                                <p className="font-semibold text-foreground">
                                  Total: {formatCurrency(getInvoiceTotalDue(invoice))}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(invoice.status)}
                              {invoice.status === 'paid' && (() => {
                                const payments = invoice.payments ?? [];
                                const dueDate = new Date(invoice.dueDate);
                                // Check if any payment was made in a different month than due date
                                const earlyPayments = payments.filter(p => !isSameMonth(new Date(p.paymentDate), dueDate));
                                const latePayments = payments.filter(p => new Date(p.paymentDate) > dueDate && !isSameMonth(new Date(p.paymentDate), dueDate));
                                if (earlyPayments.length > 0 && latePayments.length === 0) {
                                  const paymentDate = new Date(earlyPayments[0].paymentDate);
                                  return (
                                    <Badge variant="outline" className="gap-1 text-xs border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30">
                                      <CalendarClock className="h-3 w-3" />
                                      Antecipado ({format(paymentDate, 'MMM/yy', { locale: ptBR })})
                                    </Badge>
                                  );
                                }
                                if (earlyPayments.length > 0 && latePayments.length > 0) {
                                  const paymentDate = new Date(earlyPayments[0].paymentDate);
                                  return (
                                    <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                                      <CalendarClock className="h-3 w-3" />
                                      Recebido em {format(paymentDate, 'MMM/yy', { locale: ptBR })}
                                    </Badge>
                                  );
                                }
                                // Legacy: paid without payments, check paidAt
                                if (payments.length === 0 && invoice.paidAt) {
                                  const paidDate = new Date(invoice.paidAt);
                                  if (!isSameMonth(paidDate, dueDate) && paidDate < dueDate) {
                                    return (
                                      <Badge variant="outline" className="gap-1 text-xs border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30">
                                        <CalendarClock className="h-3 w-3" />
                                        Antecipado ({format(paidDate, 'MMM/yy', { locale: ptBR })})
                                      </Badge>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {invoice.status !== 'paid' && (() => {
                                const patient = patients.find(p => p.id === invoice.patientId);
                                const contact = patient?.guardianContact;
                                if (!contact) return null;
                                const cleanPhone = contact.replace(/\D/g, '');
                                if (cleanPhone.length < 10) return null;
                                const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
                                const dueDateFormatted = format(new Date(invoice.dueDate), 'dd/MM/yyyy');
                                const message = `Olá! Gostaríamos de lembrar sobre a mensalidade de *${invoice.patientName}* no valor de *${formatCurrency(getInvoiceTotalDue(invoice))}*, com vencimento em *${dueDateFormatted}*. Em caso de dúvidas, estamos à disposição.`;
                                const whatsUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                                        onClick={() => window.open(whatsUrl, '_blank')}
                                      >
                                        <MessageCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Enviar lembrete via WhatsApp</TooltipContent>
                                  </Tooltip>
                                );
                              })()}
                              {invoice.status === 'paid' ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2"
                                      onClick={() => markAsPending(invoice.id)}
                                    >
                                      <Undo2 className="h-4 w-4" />
                                      Desfazer
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Limpar recebimentos e voltar para não pago</TooltipContent>
                                </Tooltip>
                              ) : (
                                <ReceivePaymentDialog
                                  invoiceAmount={invoice.amount}
                                  paidAmount={getInvoicePaidAmount(invoice)}
                                  interestAmount={getInvoiceInterest(invoice)}
                                  onConfirm={(paymentData) => addPayment(invoice.id, paymentData)}
                                  trigger={
                                    <Button size="sm" className="gap-2">
                                      <Plus className="h-4 w-4" />
                                      Lançar recebimento
                                    </Button>
                                  }
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Payment history sub-rows */}
                        {isExpanded && payments.map((payment) => (
                          <TableRow key={payment.id} className="bg-muted/30 hover:bg-muted/50">
                            <TableCell />
                            <TableCell colSpan={2} className="text-sm text-muted-foreground pl-6">
                              {format(new Date(payment.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {invoicePaymentMethodLabels[payment.method]}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {formatCurrency(payment.amount)}
                              {payment.isLate && (
                                <Badge variant="outline" className="ml-2 text-xs border-red-300 text-red-500">
                                  Em atraso
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell />
                            <TableCell />
                          </TableRow>
                        ))}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </div>
      </main>
    </div>
  );
};

export default Invoices;
