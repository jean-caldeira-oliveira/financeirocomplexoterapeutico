import { BillDetailsModal } from "@/components/bills/BillDetailsModal";
import { BillForm } from "@/components/bills/BillForm";
import { EditBillDialog } from "@/components/bills/EditBillDialog";
import { ManageCategoriesDialog } from "@/components/bills/ManageCategoriesDialog";
import { PayBillDialog } from "@/components/bills/PayBillDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBills } from "@/hooks/useBills";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import {
  Bill,
  BillRecurrence,
  BillStatus,
  billRecurrenceLabels,
  billStatusLabels,
} from "@/types/bill";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  Undo2,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const Bills = () => {
  const {
    bills,
    stats,
    addBill,
    addBillPayment,
    revertPayment,
    markAsPending,
    deleteBill,
    deleteBillAndFuture,
    deleteAllRecurrences,
    updateBill,
    fetchBillHistory,
  } = useBills();
  const { allGroupLabels, allSubcategoryLabels, allGroupSubcategories } =
    useCustomCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [subcategoryFilters, setSubcategoryFilters] = useState<string[]>([]);

  // BillDetailsModal state
  const [detailsBill, setDetailsBill] = useState<Bill | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const currentDate = new Date();
  // Use 1-based month (getMonth()+1) so "2026-06" = June 2026, matching human-readable months
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}`
  );

  const toggleFilter = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = -12; i <= 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1
      );
      options.push({
        // getMonth()+1 → 1-based month so value matches the displayed label
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`,
        label: format(date, "MMMM yyyy", { locale: ptBR }),
      });
    }
    return options;
  }, []);

  const filteredBills = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    // month is now 1-based; getMonth() is 0-based → compare with month-1
    const monthIndex = month - 1;
    const query = searchQuery.toLowerCase().trim();

    return bills
      .filter((bill) => {
        const dueDate = new Date(bill.dueDate);
        const monthMatch =
          dueDate.getFullYear() === year && dueDate.getMonth() === monthIndex;
        const statusMatch =
          statusFilters.length === 0 || statusFilters.includes(bill.status);
        const categoryMatch =
          categoryFilters.length === 0 ||
          categoryFilters.includes(bill.category);
        const subcategoryMatch =
          subcategoryFilters.length === 0 ||
          subcategoryFilters.includes(bill.subcategory);
        const searchMatch =
          query === "" || bill.description.toLowerCase().includes(query);
        return monthMatch && statusMatch && categoryMatch && subcategoryMatch && searchMatch;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [
    bills,
    selectedMonth,
    searchQuery,
    statusFilters,
    categoryFilters,
    subcategoryFilters,
  ]);

  // Get available subcategories based on selected categories
  const availableSubcategories = useMemo(() => {
    if (categoryFilters.length === 0) {
      return Object.keys(allSubcategoryLabels);
    }
    return categoryFilters.flatMap((cat) => allGroupSubcategories[cat] || []);
  }, [categoryFilters, allSubcategoryLabels, allGroupSubcategories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-white">
            <Check className="h-3 w-3" />
            {billStatusLabels[status]}
          </Badge>
        );
      case "partially_paid":
        return (
          <Badge className="gap-1 bg-amber-500 hover:bg-amber-600 text-white">
            <Wallet className="h-3 w-3" />
            {billStatusLabels[status]}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white">
            <Clock className="h-3 w-3" />
            {billStatusLabels[status]}
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="gap-1 bg-red-500 hover:bg-red-600 text-white">
            <AlertTriangle className="h-3 w-3" />
            {billStatusLabels[status]}
          </Badge>
        );
    }
  };

  const filteredTotals = useMemo(() => {
    const paid = filteredBills.filter((b) => b.status === "paid");
    const partiallyPaid = filteredBills.filter(
      (b) => b.status === "partially_paid"
    );
    const pending = filteredBills.filter((b) => b.status === "pending");
    const overdue = filteredBills.filter((b) => b.status === "overdue");
    const total = filteredBills.reduce((sum, b) => sum + b.amount, 0);

    return {
      paid: paid.reduce(
        (sum, b) => sum + (b.totalPaid ?? b.paidAmount ?? b.amount),
        0
      ),
      partiallyPaid: partiallyPaid.reduce(
        (sum, b) => sum + (b.totalPaid ?? 0),
        0
      ),
      pending: pending.reduce((sum, b) => sum + b.amount, 0),
      overdue: overdue.reduce((sum, b) => sum + b.amount, 0),
      total,
    };
  }, [filteredBills]);

  const openDetails = (bill: Bill) => {
    setDetailsBill(bill);
    setDetailsOpen(true);
  };

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
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Contas a Pagar</h1>
              <p className="text-xs text-muted-foreground">
                Gestão de Despesas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ManageCategoriesDialog />
            <BillForm onSubmit={addBill} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Total
            </div>
            <p className="mt-1 text-2xl font-bold text-primary">
              {formatCurrency(filteredTotals.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {filteredBills.length} contas
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              Pago
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label.charAt(0).toUpperCase() +
                      option.label.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-between">
                  {statusFilters.length === 0
                    ? "Todos Status"
                    : `${statusFilters.length} selecionado(s)`}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                {[
                  { value: "paid", label: "Pagos" },
                  { value: "partially_paid", label: "Parcialmente Pagos" },
                  { value: "pending", label: "Pendentes" },
                  { value: "overdue", label: "Atrasados" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={statusFilters.includes(opt.value)}
                      onCheckedChange={() =>
                        setStatusFilters((prev) =>
                          toggleFilter(prev, opt.value)
                        )
                      }
                    />
                    {opt.label}
                  </label>
                ))}
                {statusFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 w-full text-xs"
                    onClick={() => setStatusFilters([])}
                  >
                    <X className="mr-1 h-3 w-3" /> Limpar
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  {categoryFilters.length === 0
                    ? "Todas Categorias"
                    : `${categoryFilters.length} selecionada(s)`}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[240px] p-2 max-h-64 overflow-y-auto"
                align="start"
              >
                {Object.entries(allGroupLabels).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={categoryFilters.includes(key)}
                      onCheckedChange={() => {
                        setCategoryFilters((prev) => toggleFilter(prev, key));
                        setSubcategoryFilters([]);
                      }}
                    />
                    {label}
                  </label>
                ))}
                {categoryFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 w-full text-xs"
                    onClick={() => {
                      setCategoryFilters([]);
                      setSubcategoryFilters([]);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" /> Limpar
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  {subcategoryFilters.length === 0
                    ? "Todas Subcategorias"
                    : `${subcategoryFilters.length} selecionada(s)`}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[240px] p-2 max-h-64 overflow-y-auto"
                align="start"
              >
                {availableSubcategories.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={subcategoryFilters.includes(key)}
                      onCheckedChange={() =>
                        setSubcategoryFilters((prev) => toggleFilter(prev, key))
                      }
                    />
                    {allSubcategoryLabels[key] || key}
                  </label>
                ))}
                {subcategoryFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 w-full text-xs"
                    onClick={() => setSubcategoryFilters([])}
                  >
                    <X className="mr-1 h-3 w-3" /> Limpar
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <Badge variant="outline" className="gap-2 py-2">
            <span className="font-normal text-muted-foreground">
              Total no mês:
            </span>
            <span className="font-bold">{filteredBills.length} contas</span>
          </Badge>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                Nenhuma conta encontrada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente ajustar os filtros ou cadastre novas contas
              </p>
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Recorrência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow
                      key={bill.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => openDetails(bill)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          {bill.description}
                          {bill.totalInstallments && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {bill.installmentNumber}/{bill.totalInstallments}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {allGroupLabels[bill.category] || bill.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        {bill.recurrence !== "none" ? (
                          <Badge variant="outline" className="gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {
                              billRecurrenceLabels[
                                bill.recurrence as BillRecurrence
                              ]
                            }
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(bill.dueDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {(bill.totalPaid ?? 0) > 0 ? (
                          <div>
                            <span className="text-sm font-medium text-green-600">
                              {formatCurrency(bill.totalPaid ?? 0)}
                            </span>
                            {bill.status === "partially_paid" && (
                              <div className="text-xs text-amber-500">
                                de {formatCurrency(bill.amount)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(bill.amount)}</TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <EditBillDialog
                            bill={bill}
                            onSave={(id, data, scope) =>
                              updateBill(id, data, scope)
                            }
                          />

                          {bill.status === "paid" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => markAsPending(bill.id)}
                                >
                                  <Undo2 className="h-4 w-4" />
                                  Desfazer
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Marcar como não pago
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <PayBillDialog
                              onConfirm={(lines) =>
                                addBillPayment(bill.id, lines)
                              }
                              billAmount={bill.amount}
                              billDueDate={bill.dueDate}
                              alreadyPaid={bill.totalPaid ?? 0}
                              trigger={
                                <Button
                                  size="sm"
                                  className={`gap-2 ${
                                    bill.status === "partially_paid"
                                      ? "bg-amber-500 hover:bg-amber-600"
                                      : "bg-green-500 hover:bg-green-600"
                                  }`}
                                >
                                  <Check className="h-4 w-4" />
                                  {bill.status === "partially_paid"
                                    ? "Completar"
                                    : "Pagar"}
                                </Button>
                              }
                            />
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir conta?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {bill.recurrenceGroupId
                                    ? `"${bill.description}" faz parte de uma série. Escolha como deseja excluir:`
                                    : `Esta ação não pode ser desfeita. A conta "${bill.description}" será removida permanentemente.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                                <AlertDialogCancel className="mt-0">
                                  Cancelar
                                </AlertDialogCancel>
                                {bill.recurrenceGroupId ? (
                                  <>
                                    <AlertDialogAction
                                      onClick={() => deleteBill(bill.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir apenas esta
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteBillAndFuture(bill.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir esta e as futuras
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteAllRecurrences(bill.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir toda a série
                                    </AlertDialogAction>
                                  </>
                                ) : (
                                  <AlertDialogAction
                                    onClick={() => deleteBill(bill.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                )}
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </div>
      </main>

      {/* Bill Details Modal */}
      <BillDetailsModal
        bill={detailsBill}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onRevertPayment={(paymentId, billId) => {
          revertPayment(paymentId, billId);
          // Update the detailsBill reference after revert
          setDetailsBill((prev) =>
            prev
              ? {
                  ...prev,
                  payments: (prev.payments ?? []).filter(
                    (p) => p.id !== paymentId
                  ),
                  totalPaid: (prev.payments ?? [])
                    .filter((p) => p.id !== paymentId)
                    .reduce((s, p) => s + p.amount, 0),
                }
              : null
          );
        }}
        fetchHistory={fetchBillHistory}
      />
    </div>
  );
};

export default Bills;
