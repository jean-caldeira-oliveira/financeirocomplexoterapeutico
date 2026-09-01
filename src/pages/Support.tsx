import { TicketColumn } from '@/components/support/TicketColumn';
import { TicketDetailsDialog } from '@/components/support/TicketDetailsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import {
  SupportTicket,
  TicketSeverity,
  TicketStatus,
  TicketType,
  ticketSeverityLabels,
  ticketStatusLabels,
  ticketTabLabels,
  ticketTypeLabels,
} from '@/types/supportTicket';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { LifeBuoy, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TicketCard } from '@/components/support/TicketCard';

const kanbanColumns: { status: TicketStatus; label: string }[] = [
  { status: 'triagem', label: ticketStatusLabels.triagem },
  { status: 'em_desenvolvimento', label: ticketStatusLabels.em_desenvolvimento },
  { status: 'validacao', label: ticketStatusLabels.validacao },
  { status: 'concluido', label: ticketStatusLabels.concluido },
];

export default function Support() {
  const { isAdmin } = useIsAdmin();
  const { tickets, createTicket, updateTicketStatus } = useSupportTickets();

  const [ticketType, setTicketType] = useState<TicketType | ''>('');
  const [severity, setSeverity] = useState<TicketSeverity | ''>('');
  const [tab, setTab] = useState('');
  const [description, setDescription] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ticketsByStatus = useMemo(() => {
    const map: Record<TicketStatus, SupportTicket[]> = {
      triagem: [],
      em_desenvolvimento: [],
      validacao: [],
      concluido: [],
    };
    for (const ticket of tickets) {
      map[ticket.status]?.push(ticket);
    }
    return map;
  }, [tickets]);

  const isFormValid = ticketType && severity && tab && description.trim().length > 0;

  const handleSubmit = () => {
    if (!ticketType || !severity || !tab || !description.trim()) return;

    createTicket.mutate(
      { ticketType, severity, tab, description: description.trim() },
      {
        onSuccess: () => {
          setTicketType('');
          setSeverity('');
          setTab('');
          setDescription('');
        },
      }
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const ticket = tickets.find((t) => t.id === active.id);
    if (!ticket) return;

    const overColumn = kanbanColumns.find((c) => c.status === over.id);
    const targetStatus = overColumn
      ? overColumn.status
      : tickets.find((t) => t.id === over.id)?.status;

    if (!targetStatus || targetStatus === ticket.status) return;

    updateTicketStatus.mutate({ id: ticket.id, status: targetStatus });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 px-4 py-6 backdrop-blur-lg">
        <div className="container mx-auto flex items-center gap-3 px-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <LifeBuoy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Suporte</h1>
            <p className="text-sm text-muted-foreground">
              Abra um chamado para reportar um problema, tirar uma dúvida ou solicitar um ajuste
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-8 px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Novo Chamado</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para abrir um novo chamado de suporte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Chamado</Label>
                <Select value={ticketType} onValueChange={(v) => setTicketType(v as TicketType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {(Object.keys(ticketTypeLabels) as TicketType[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {ticketTypeLabels[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Severidade</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as TicketSeverity)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a severidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {(Object.keys(ticketSeverityLabels) as TicketSeverity[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {ticketSeverityLabels[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Aba</Label>
                <Select value={tab} onValueChange={setTab}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aba relacionada" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {Object.entries(ticketTabLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <p className="text-xs text-muted-foreground">
                Seja o mais detalhado possível: descreva o passo a passo para reproduzir o problema,
                explique claramente o que precisa ser feito ou detalhe sua dúvida. Quanto mais
                informação, mais rápido o chamado poderá ser resolvido.
              </p>
              <Textarea
                placeholder="Descreva aqui o passo a passo, a solicitação ou a dúvida..."
                rows={6}
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={handleSubmit} disabled={!isFormValid || createTicket.isPending}>
                <Send className="mr-2 h-4 w-4" />
                Enviar Chamado
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Acompanhamento de Chamados
            </h2>
            {!isAdmin && (
              <span className="text-xs text-muted-foreground">
                Somente administradores podem mover os chamados entre as colunas
              </span>
            )}
          </div>

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kanbanColumns.map((column) => (
                <TicketColumn
                  key={column.status}
                  status={column.status}
                  label={column.label}
                  tickets={ticketsByStatus[column.status]}
                  onTicketClick={setSelectedTicket}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTicket && <TicketCard ticket={activeTicket} onClick={() => {}} />}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      <TicketDetailsDialog ticket={selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)} />
    </div>
  );
}
