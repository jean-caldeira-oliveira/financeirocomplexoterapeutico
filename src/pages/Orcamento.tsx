import { BudgetQuoteForm } from "@/components/budget/BudgetQuoteForm";
import { BudgetQuoteHistory } from "@/components/budget/BudgetQuoteHistory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function Orcamento() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Orçamentos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Proposta de Acolhimento</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para gerar o PDF da proposta de acolhimento terapêutico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetQuoteForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Orçamentos</CardTitle>
          <CardDescription>Orçamentos gerados anteriormente.</CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetQuoteHistory />
        </CardContent>
      </Card>
    </div>
  );
}
