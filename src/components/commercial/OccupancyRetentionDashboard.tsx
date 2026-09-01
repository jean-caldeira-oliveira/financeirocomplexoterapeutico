import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWardOccupancy, WARD_CAPACITY } from "@/hooks/useWardOccupancy";
import { format } from "date-fns";
import { Users } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function OccupancyRetentionDashboard() {
  const { patientsByWard, wardOccupancy, wardLeavingForecast, ticketMedio } =
    useWardOccupancy();

  const wardLabel = { feminina: "Feminina", masculina: "Masculina" } as const;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
      {(["feminina", "masculina"] as const).map((ward) => (
        <div
          key={ward}
          className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Pacientes Ala {wardLabel[ward]}
              </p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-bold tracking-tight">
                  {patientsByWard[ward]}
                </p>
                <p className="text-sm text-muted-foreground">
                  / {WARD_CAPACITY[ward]} vagas
                </p>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-muted/50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                Ocupação atual
              </p>
              <p className="text-sm font-semibold">
                {wardOccupancy[ward].currentRate.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                Prev. próx. mês
              </p>
              <p className="text-sm font-semibold">
                {wardOccupancy[ward].nextMonthRate.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                Prev. 3 meses
              </p>
              <p className="text-sm font-semibold">
                {wardOccupancy[ward].rate3Months.toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="mt-2 pt-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
              Estimativa de saída
            </p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-orange-500">
                  {wardLeavingForecast[ward].nextMonth}
                </span>
                <span className="text-[11px] text-muted-foreground">próx. mês</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-orange-400">
                  {wardLeavingForecast[ward].next3Months}
                </span>
                <span className="text-[11px] text-muted-foreground">em 3 meses</span>
              </div>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
              Baseado nos contratos
            </p>
          </div>

          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Margem livre para anunciar
            </p>
            <div className="mt-0.5 flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {wardOccupancy[ward].freeSpotsNextMonth}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  vagas ({wardOccupancy[ward].freeRateNextMonth.toFixed(0)}%) próx. mês
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {wardOccupancy[ward].freeSpots3Months}
              </span>
              <span className="text-[11px] text-muted-foreground">
                vagas ({wardOccupancy[ward].freeRate3Months.toFixed(0)}%) em 3 meses
              </span>
            </div>
            <p className="mt-1.5 border-t border-emerald-500/20 pt-1.5 text-[11px] text-muted-foreground">
              Meta:{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {wardOccupancy[ward].admissionsPerWeekNeeded.toFixed(1)}
              </span>{" "}
              internações/semana p/ manter ocupação
            </p>
          </div>

          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Potencial de faturamento adicional
            </p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(wardOccupancy[ward].freeSpotsCurrent * ticketMedio)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                /mês com ocupação 100% ({wardOccupancy[ward].freeSpotsCurrent} vagas
                vazias × ticket médio)
              </span>
            </div>
          </div>

          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10 blur-2xl" />
        </div>
      ))}

      {/* Possibilidade de Retenção */}
      <div className="relative overflow-hidden rounded-xl p-6 card-hover animate-fade-in bg-card border border-border shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Possibilidade de retenção
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pacientes que podem ter seu contrato renovado ou ambulatorial oferecido
        </p>

        <Tabs defaultValue="nextMonth" className="mt-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nextMonth">
              Próx. mês ({wardLeavingForecast.retentionList.nextMonth.length})
            </TabsTrigger>
            <TabsTrigger value="next3Months">
              3 meses ({wardLeavingForecast.retentionList.next3Months.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="nextMonth">
            <ScrollArea className="h-64 pr-2">
              {wardLeavingForecast.retentionList.nextMonth.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum contrato vencendo no próximo mês
                </p>
              ) : (
                <div className="space-y-1.5">
                  {wardLeavingForecast.retentionList.nextMonth.map((p) => (
                    <div
                      key={p.patientId}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Badge
                          variant="outline"
                          className={
                            p.ward === "feminina"
                              ? "shrink-0 border-pink-500/30 text-pink-600 dark:text-pink-400"
                              : "shrink-0 border-blue-500/30 text-blue-600 dark:text-blue-400"
                          }
                        >
                          {p.ward === "feminina" ? "Fem" : "Masc"}
                        </Badge>
                        <span className="truncate text-sm">{p.name}</span>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {format(p.dueDate, "dd/MM")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="next3Months">
            <ScrollArea className="h-64 pr-2">
              {wardLeavingForecast.retentionList.next3Months.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum contrato vencendo nos próximos 3 meses
                </p>
              ) : (
                <div className="space-y-1.5">
                  {wardLeavingForecast.retentionList.next3Months.map((p) => (
                    <div
                      key={p.patientId}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Badge
                          variant="outline"
                          className={
                            p.ward === "feminina"
                              ? "shrink-0 border-pink-500/30 text-pink-600 dark:text-pink-400"
                              : "shrink-0 border-blue-500/30 text-blue-600 dark:text-blue-400"
                          }
                        >
                          {p.ward === "feminina" ? "Fem" : "Masc"}
                        </Badge>
                        <span className="truncate text-sm">{p.name}</span>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {format(p.dueDate, "dd/MM")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
