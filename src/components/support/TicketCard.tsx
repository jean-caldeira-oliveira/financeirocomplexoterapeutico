import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import {
  SupportTicket,
  ticketSeverityLabels,
  ticketTabLabels,
  ticketTypeLabels,
} from "@/types/supportTicket";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare } from "lucide-react";

const severityVariant: Record<SupportTicket["severity"], string> = {
  bloqueio: "border-transparent bg-destructive text-destructive-foreground",
  alta: "border-transparent bg-orange-500 text-white",
  media: "border-transparent bg-yellow-500 text-white",
  baixa: "border-transparent bg-secondary text-secondary-foreground",
};

interface TicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const { isAdmin } = useIsAdmin();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isAdmin ? attributes : {})}
      {...(isAdmin ? listeners : {})}
      onClick={onClick}
      className={cn(
        "space-y-2 rounded-md border bg-background p-3 text-left shadow-sm transition-shadow hover:shadow-md",
        isAdmin ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {ticketTypeLabels[ticket.ticketType]}
        </span>
        <Badge className={severityVariant[ticket.severity]}>
          {ticketSeverityLabels[ticket.severity]}
        </Badge>
      </div>

      <p className="line-clamp-3 text-sm">{ticket.description}</p>

      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
        <Badge variant="outline">{ticketTabLabels[ticket.tab] ?? ticket.tab}</Badge>
        <div className="flex items-center gap-3">
          {!!ticket.commentCount && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {ticket.commentCount}
            </span>
          )}
          <span>{format(new Date(ticket.createdAt), "dd/MM", { locale: ptBR })}</span>
        </div>
      </div>
    </div>
  );
}
