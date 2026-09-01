import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSupportTickets, useTicketComments } from "@/hooks/useSupportTickets";
import {
  SupportTicket,
  ticketSeverityLabels,
  ticketStatusLabels,
  ticketTabLabels,
  ticketTypeLabels,
} from "@/types/supportTicket";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Trash2 } from "lucide-react";
import { useState } from "react";

interface TicketDetailsDialogProps {
  ticket: SupportTicket | null;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetailsDialog({ ticket, onOpenChange }: TicketDetailsDialogProps) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { deleteTicket } = useSupportTickets();
  const { comments, addComment, deleteComment } = useTicketComments(ticket?.id ?? null);
  const [newComment, setNewComment] = useState("");

  if (!ticket) return null;

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    addComment.mutate(newComment.trim(), {
      onSuccess: () => setNewComment(""),
    });
  };

  const handleDeleteTicket = () => {
    deleteTicket.mutate(ticket.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={!!ticket} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <DialogTitle>{ticketTypeLabels[ticket.ticketType]}</DialogTitle>
            <Badge variant="outline">{ticketStatusLabels[ticket.status]}</Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{ticketSeverityLabels[ticket.severity]}</Badge>
          <Badge variant="outline">{ticketTabLabels[ticket.tab] ?? ticket.tab}</Badge>
        </div>

        <div className="rounded-md border bg-muted/30 p-3">
          <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Aberto por {ticket.userName ?? "Usuário"} em{" "}
          {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>

        {isAdmin && (
          <Button
            variant="destructive"
            size="sm"
            className="w-fit"
            onClick={handleDeleteTicket}
            disabled={deleteTicket.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Chamado
          </Button>
        )}

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Comentários</h3>

          <div className="space-y-3">
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{comment.userName ?? "Usuário"}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => deleteComment.mutate(comment.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Excluir comentário"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{comment.comment}</p>
              </div>
            ))}
          </div>

          {user && (
            <div className="space-y-2 pt-2">
              <Textarea
                placeholder="Escreva um comentário..."
                rows={3}
                className="resize-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSendComment}
                  disabled={!newComment.trim() || addComment.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Comentar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
