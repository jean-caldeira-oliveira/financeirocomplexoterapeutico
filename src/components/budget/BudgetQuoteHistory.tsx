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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBudgetQuotes } from "@/hooks/useBudgetQuotes";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { exportBudgetQuotePDF } from "@/utils/exportBudgetQuotePDF";
import { roomTypeLabels, roomTypeOrder } from "@/types/budgetQuote";
import { FileDown, Loader2, Trash2 } from "lucide-react";

function fmt(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("pt-BR");
}

export function BudgetQuoteHistory() {
  const { quotes, isLoading, deleteQuote } = useBudgetQuotes();
  const { isAdmin } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando orçamentos...
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhum orçamento gerado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Mensalidades (Col. / Semi / Priv.)</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Gerado por</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="font-medium">{quote.patientName}</TableCell>
              <TableCell>{quote.guardianName}</TableCell>
              <TableCell className="whitespace-nowrap text-xs">
                {roomTypeOrder
                  .map((type) => `${roomTypeLabels[type].replace("Quarto ", "")}: ${fmt(quote.roomPricing[type].monthlyFee)}`)
                  .join(" · ")}
              </TableCell>
              <TableCell>{fmtDate(quote.createdAt)}</TableCell>
              <TableCell>{quote.userName ?? "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Baixar PDF novamente"
                    onClick={() => exportBudgetQuotePDF(quote)}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Excluir">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O orçamento de {quote.patientName} será
                            removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteQuote.mutate(quote.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
