import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  filterCasesByPolarity,
  filterDeadlinesByPolarity,
  getCaseStatusSummary,
  getRiskSummary,
  LegalCasePolarity,
  LegalCaseStatus,
  LegalDeadline,
  LegalRiskLevel,
} from "@/data/legalMockData";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Clock, DollarSign, Scale } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

const riskLabels: Record<LegalRiskLevel, string> = {
  alto: "Alto risco",
  medio: "Médio risco",
  baixo: "Baixo risco",
};

const riskDot: Record<LegalRiskLevel, string> = {
  alto: "bg-red-500",
  medio: "bg-yellow-500",
  baixo: "bg-green-500",
};

const riskText: Record<LegalRiskLevel, string> = {
  alto: "text-red-600 dark:text-red-400",
  medio: "text-yellow-600 dark:text-yellow-400",
  baixo: "text-green-600 dark:text-green-400",
};

const statusLabels: Record<LegalCaseStatus, string> = {
  em_andamento: "Em andamento",
  aguardando_decisao: "Aguardando decisão",
  aguardando_documentacao: "Aguardando documentação",
  critico: "Crítico",
  encerrado_mes: "Encerrado no mês",
};

const statusDot: Record<LegalCaseStatus, string> = {
  em_andamento: "bg-yellow-500",
  aguardando_decisao: "bg-blue-500",
  aguardando_documentacao: "bg-orange-500",
  critico: "bg-red-500",
  encerrado_mes: "bg-green-500",
};

const deadlineUrgencyDot: Record<LegalDeadline["urgency"], string> = {
  hoje: "bg-red-500",
  semana: "bg-orange-500",
  mes: "bg-yellow-500",
};

type PolarityFilter = LegalCasePolarity | "todos";

const polarityOptions: { value: PolarityFilter; label: string; icon: typeof ArrowUpFromLine }[] = [
  { value: "todos", label: "Todos", icon: Scale },
  { value: "ativo", label: "Ativos (movendo)", icon: ArrowUpFromLine },
  { value: "passivo", label: "Passivos (sofrendo)", icon: ArrowDownToLine },
];

export function LegalDashboard() {
  const [polarity, setPolarity] = useState<PolarityFilter>("todos");

  const cases = useMemo(() => filterCasesByPolarity(polarity), [polarity]);
  const deadlines = useMemo(() => filterDeadlinesByPolarity(polarity), [polarity]);
  const riskSummary = useMemo(() => getRiskSummary(cases), [cases]);
  const caseStatusSummary = useMemo(() => getCaseStatusSummary(cases), [cases]);

  const totalValueAtStake = riskSummary.reduce((sum, r) => sum + r.valueAtStake, 0);
  const totalCases = riskSummary.reduce((sum, r) => sum + r.count, 0);

  const deadlinesToday = deadlines.filter((d) => d.urgency === "hoje");
  const deadlinesWeek = deadlines.filter((d) => d.urgency === "hoje" || d.urgency === "semana");
  const deadlinesMonth = deadlines;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Dados de demonstração — este módulo ainda não está integrado a dados reais.
      </p>

      {/* Toggle Ativos / Passivos / Todos */}
      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {polarityOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPolarity(opt.value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              polarity === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Risco jurídico atual */}
        <div className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Risco jurídico atual
            </p>
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {totalCases} <span className="text-sm font-normal text-muted-foreground">casos monitorados</span>
          </p>

          <div className="mt-4 space-y-2">
            {riskSummary.map((r) => (
              <div
                key={r.level}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${riskDot[r.level]}`} />
                  <span className="text-sm">{riskLabels[r.level]}</span>
                </div>
                <span className={`text-sm font-bold ${riskText[r.level]}`}>{r.count}</span>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            {riskSummary.find((r) => r.level === "alto")?.count ?? 0} situações que podem
            gerar impacto sério.
          </p>
        </div>

        {/* Valor envolvido em processos */}
        <div className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Valor envolvido em processos
            </p>
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {formatCurrency(totalValueAtStake)}
          </p>
          <p className="text-xs text-muted-foreground">Valor total em risco</p>

          <div className="mt-4 space-y-2">
            {riskSummary.map((r) => (
              <div
                key={r.level}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${riskDot[r.level]}`} />
                  <span className="text-sm">{riskLabels[r.level]}</span>
                </div>
                <span className={`text-sm font-bold ${riskText[r.level]}`}>
                  {formatCurrency(r.valueAtStake)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Prazos críticos */}
        <div className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Próximos prazos</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Nenhum prazo jurídico pode passar despercebido.
          </p>

          <Tabs defaultValue="hoje" className="mt-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hoje">Hoje ({deadlinesToday.length})</TabsTrigger>
              <TabsTrigger value="semana">7 dias ({deadlinesWeek.length})</TabsTrigger>
              <TabsTrigger value="mes">30 dias ({deadlinesMonth.length})</TabsTrigger>
            </TabsList>

            {[
              { value: "hoje", list: deadlinesToday, empty: "Nenhum prazo para hoje" },
              { value: "semana", list: deadlinesWeek, empty: "Nenhum prazo nos próximos 7 dias" },
              { value: "mes", list: deadlinesMonth, empty: "Nenhum prazo nos próximos 30 dias" },
            ].map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <ScrollArea className="h-64 pr-2">
                  {tab.list.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">{tab.empty}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {tab.list.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${deadlineUrgencyDot[d.urgency]}`}
                            />
                            <span className="truncate text-sm">{d.description}</span>
                            <Badge
                              variant="outline"
                              className={
                                d.polarity === "ativo"
                                  ? "shrink-0 border-blue-500/30 text-[10px] text-blue-600 dark:text-blue-400"
                                  : "shrink-0 border-purple-500/30 text-[10px] text-purple-600 dark:text-purple-400"
                              }
                            >
                              {d.polarity === "ativo" ? "Ativo" : "Passivo"}
                            </Badge>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {d.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Processos / casos por status */}
        <div className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Situação dos casos</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajuda a entender se o jurídico está acumulando demandas.
          </p>

          <div className="mt-4 space-y-2">
            {caseStatusSummary.map((s) => (
              <div
                key={s.status}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusDot[s.status]}`} />
                  <span className="text-sm">{statusLabels[s.status]}</span>
                </div>
                <Badge variant="outline" className="font-bold">
                  {s.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
