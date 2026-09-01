import { Badge } from "@/components/ui/badge";
import { SupportTicket, TicketStatus } from "@/types/supportTicket";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TicketCard } from "./TicketCard";

interface TicketColumnProps {
  status: TicketStatus;
  label: string;
  tickets: SupportTicket[];
  onTicketClick: (ticket: SupportTicket) => void;
}

export function TicketColumn({ status, label, tickets, onTicketClick }: TicketColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">{label}</span>
        <Badge variant="secondary">{tickets.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-col gap-2 p-3 transition-colors ${
          isOver ? "bg-muted/50" : ""
        }`}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
              Nenhum chamado
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
