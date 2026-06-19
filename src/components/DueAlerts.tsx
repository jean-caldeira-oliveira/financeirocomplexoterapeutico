import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBills } from "@/hooks/useBills";
import { useInvoices } from "@/hooks/useInvoices";
import { differenceInDays, startOfDay } from "date-fns";
import { FileText, Receipt } from "lucide-react";
import { useMemo } from "react";

interface DueItem {
  id: string;
  type: "invoice" | "bill";
  description: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  isOverdue: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getDaysLabel = (days: number) => {
  if (days < 0) {
    const abs = Math.abs(days);
    return `${abs} dia${abs > 1 ? "s" : ""} atrasado`;
  }
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  return `Vence em ${days} dias`;
};

function ItemRow({ item, color }: { item: DueItem; color: "red" | "yellow" }) {
  const borderClass = color === "red"
    ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20"
    : "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20";
  const textClass = color === "red"
    ? "text-red-600 dark:text-red-400"
    : "text-yellow-700 dark:text-yellow-400";
  const badgeClass = color === "red"
    ? "border-red-300 text-red-600"
    : "border-yellow-300 text-yellow-700";
  const iconClass = color === "red" ? "text-red-500" : "text-yellow-600";

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${borderClass}`}>
      <div>
        {item.type === "invoice" ? (
          <Receipt className={`h-4 w-4 ${iconClass}`} />
        ) : (
          <FileText className={`h-4 w-4 ${iconClass}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.description}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-xs ${textClass}`}>{getDaysLabel(item.daysUntilDue)}</span>
          <Badge variant="outline" className={`text-xs ${badgeClass}`}>
            {item.type === "invoice" ? "Mensalidade" : "Conta"}
          </Badge>
        </div>
      </div>
      <span className={`text-sm font-semibold shrink-0 ${textClass}`}>
        {formatCurrency(item.amount)}
      </span>
    </div>
  );
}

function AccordionSection({
  value,
  label,
  items,
  color,
  emptyText,
  subtitle,
}: {
  value: string;
  label: string;
  items: DueItem[];
  color: "red" | "yellow";
  emptyText: string;
  subtitle?: string;
}) {
  const countClass = color === "red" ? "text-red-500" : "text-yellow-600";

  return (
    <AccordionItem value={value} className="border rounded-lg px-3">
      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
        <span className="flex items-baseline gap-2">
          {label}{" "}
          <span className={`font-semibold ${countClass}`}>({items.length})</span>
          {subtitle && (
            <span className="text-xs font-normal text-muted-foreground">{subtitle}</span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 pb-3">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">{emptyText}</p>
          ) : (
            items.map((item) => (
              <ItemRow key={`${item.type}-${item.id}`} item={item} color={color} />
            ))
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function DueAlerts() {
  const { invoices } = useInvoices();
  const { bills } = useBills();

  const { overdueInvoices, upcomingInvoices, overdueBills, upcomingBills } = useMemo(() => {
    const today = startOfDay(new Date());

    const toItem = (
      id: string,
      type: "invoice" | "bill",
      description: string,
      amount: number,
      rawDueDate: string | Date
    ): DueItem => {
      const dueDate = startOfDay(new Date(rawDueDate));
      const daysUntilDue = differenceInDays(dueDate, today);
      return { id, type, description, amount, dueDate, daysUntilDue, isOverdue: daysUntilDue < 0 };
    };

    const invoiceItems = invoices
      .filter((inv) => inv.status !== "paid" && inv.status !== "pre_system")
      .map((inv) =>
        toItem(
          inv.id,
          "invoice",
          `${inv.patientName} - Parcela ${inv.installmentNumber}/${inv.totalInstallments}`,
          inv.amount,
          inv.dueDate
        )
      )
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    const billItems = bills
      .filter((bill) => bill.status !== "paid" && bill.status !== "pre_system")
      .map((bill) => toItem(bill.id, "bill", bill.description, bill.amount, bill.dueDate))
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return {
      overdueInvoices: invoiceItems.filter((i) => i.isOverdue),
      upcomingInvoices: invoiceItems.filter((i) => !i.isOverdue && i.daysUntilDue <= 7),
      overdueBills: billItems.filter((i) => i.isOverdue),
      upcomingBills: billItems.filter((i) => !i.isOverdue && i.daysUntilDue <= 7),
    };
  }, [invoices, bills]);

  return (
    <ScrollArea className="h-[420px] pr-2">
      <Accordion type="multiple" defaultValue={["overdue-invoices"]} className="space-y-2">
        <AccordionSection
          value="overdue-invoices"
          label="Cobranças Vencidas"
          items={overdueInvoices}
          color="red"
          emptyText="Nenhuma cobrança vencida"
        />
        <AccordionSection
          value="upcoming-invoices"
          label="Cobranças a Vencer"
          items={upcomingInvoices}
          color="yellow"
          emptyText="Nenhuma cobrança a vencer nos próximos 7 dias"
          subtitle="próximos 7 dias"
        />
        <AccordionSection
          value="overdue-bills"
          label="Contas Vencidas"
          items={overdueBills}
          color="red"
          emptyText="Nenhuma conta vencida"
        />
        <AccordionSection
          value="upcoming-bills"
          label="Contas a Vencer"
          items={upcomingBills}
          color="yellow"
          emptyText="Nenhuma conta a vencer nos próximos 7 dias"
          subtitle="próximos 7 dias"
        />
      </Accordion>
    </ScrollArea>
  );
}
