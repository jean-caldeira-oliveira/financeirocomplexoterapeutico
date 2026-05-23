import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bill,
  BillHistory,
  billPaymentMethodLabels,
  billStatusLabels,
} from "@/types/bill";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Check,
  Clock,
  CreditCard,
  FileText,
  History,
  Loader2,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

interface BillDetailsModalProps {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  onRevertPayment: (paymentId: string, billId: string) => void;
  fetchHistory: (billId: string) => Promise<BillHistory[]>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (iso: string) =>
  format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

const formatDateTime = (iso: string) =>
  format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

function StatusBadge({ status }: { status: Bill["status"] }) {
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
}

function actionIcon(action: BillHistory["action"]) {
  switch (action) {
    case "create":
      return "📅";
    case "edit":
      return "✏️";
    case "partial_payment":
      return "💰";
    case "full_payment":
      return "✅";
    case "revert_payment":
      return "↩️";
    case "delete":
      return "🗑️";
    case "status_change":
      return "🔄";
    default:
      return "📋";
  }
}

export function BillDetailsModal({
  bill,
  open,
  onClose,
  onRevertPayment,
  fetchHistory,
}: BillDetailsModalProps) {
  const [history, setHistory] = useState<BillHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("payments");

  useEffect(() => {
    if (open && bill) {
      setActiveTab("payments");
      setHistory([]);
    }
  }, [open, bill?.id]);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    if (tab === "history" && bill && history.length === 0) {
      setLoadingHistory(true);
      const data = await fetchHistory(bill.id);
      setHistory(data);
      setLoadingHistory(false);
    }
  };

  if (!bill) return null;

  const payments = bill.payments ?? [];
  const totalPaid = bill.totalPaid ?? 0;
  const remaining = bill.amount - totalPaid;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Detalhes da Conta
          </DialogTitle>
        </DialogHeader>

        {/* ── Header info ── */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base leading-tight">
                {bill.description}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {bill.category}
                {bill.subcategory ? ` › ${bill.subcategory}` : ""}
              </p>
            </div>
            <StatusBadge status={bill.status} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="font-semibold">{formatCurrency(bill.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vencimento</p>
              <p className="font-semibold">{formatDate(bill.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pago</p>
              <p className="font-semibold text-green-500">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo Restante</p>
              <p
                className={`font-semibold ${
                  remaining <= 0 ? "text-green-500" : "text-yellow-500"
                }`}
              >
                {formatCurrency(Math.max(0, remaining))}
              </p>
            </div>
          </div>

          {bill.installmentNumber && bill.totalInstallments && (
            <p className="text-xs text-muted-foreground">
              Parcela {bill.installmentNumber}/{bill.totalInstallments}
            </p>
          )}

          {bill.notes && (
            <div className="rounded border border-border bg-background p-2">
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm whitespace-pre-wrap">{bill.notes}</p>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="payments" className="flex-1 gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamentos
              {payments.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {payments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* ── Payments tab ── */}
          <TabsContent value="payments" className="mt-3">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Wallet className="h-8 w-8 opacity-40" />
                <p className="text-sm">Nenhum pagamento registrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-green-500">
                          {formatCurrency(payment.amount)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {billPaymentMethodLabels[payment.paymentMethod]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate)}
                        </span>
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground truncate">
                          {payment.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Registrado em {formatDateTime(payment.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      title="Estornar pagamento"
                      onClick={() => onRevertPayment(payment.id, bill.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                {/* Total summary */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Total pago ({payments.length} registro
                    {payments.length !== 1 ? "s" : ""})
                  </span>
                  <span className="font-semibold text-green-500">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── History tab ── */}
          <TabsContent value="history" className="mt-3">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Carregando histórico...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <History className="h-8 w-8 opacity-40" />
                <p className="text-sm">Nenhum registro de histórico</p>
              </div>
            ) : (
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

                {history.map((entry, idx) => (
                  <div key={entry.id} className="relative flex gap-4 pb-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm">
                      {actionIcon(entry.action)}
                    </div>

                    <div className="flex-1 min-w-0 pt-1 space-y-0.5">
                      <p className="text-sm leading-snug">
                        {entry.description ?? entry.action}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{formatDateTime(entry.createdAt)}</span>
                        {entry.userName && (
                          <>
                            <span>·</span>
                            <span>{entry.userName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
