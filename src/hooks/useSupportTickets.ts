import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  SupportTicket,
  SupportTicketComment,
  TicketSeverity,
  TicketStatus,
  TicketType,
} from "@/types/supportTicket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface NewTicketData {
  ticketType: TicketType;
  severity: TicketSeverity;
  tab: string;
  description: string;
}

const mapTicketRow = (row: any): SupportTicket => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name ?? undefined,
  ticketType: row.ticket_type as TicketType,
  severity: row.severity as TicketSeverity,
  tab: row.tab,
  description: row.description,
  status: row.status as TicketStatus,
  createdAt: row.created_at,
  commentCount: row.support_ticket_comments?.[0]?.count ?? 0,
});

const mapCommentRow = (row: any): SupportTicketComment => ({
  id: row.id,
  ticketId: row.ticket_id,
  userId: row.user_id,
  userName: row.user_name ?? undefined,
  comment: row.comment,
  createdAt: row.created_at,
});

const getUserName = (user: { user_metadata?: { full_name?: string }; email?: string | null } | null) =>
  user?.user_metadata?.full_name ?? user?.email ?? "Usuário";

export function useSupportTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, support_ticket_comments(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(mapTicketRow);
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async (data: NewTicketData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        user_name: getUserName(user),
        ticket_type: data.ticketType,
        severity: data.severity,
        tab: data.tab,
        description: data.description,
        status: "triagem",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Chamado aberto com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao abrir chamado: " + error.message);
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["support-tickets"] });
      const previous = queryClient.getQueryData<SupportTicket[]>(["support-tickets"]);

      queryClient.setQueryData<SupportTicket[]>(["support-tickets"], (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, status } : t))
      );

      return { previous };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["support-tickets"], context.previous);
      }
      toast.error("Erro ao mover chamado: " + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Chamado excluído");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir chamado: " + error.message);
    },
  });

  return {
    tickets,
    isLoading,
    createTicket,
    updateTicketStatus,
    deleteTicket,
  };
}

export function useTicketComments(ticketId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["support-ticket-comments", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId as string)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapCommentRow);
    },
    enabled: !!ticketId,
  });

  const addComment = useMutation({
    mutationFn: async (comment: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (!ticketId) throw new Error("Chamado inválido");

      const { error } = await supabase.from("support_ticket_comments").insert({
        ticket_id: ticketId,
        user_id: user.id,
        user_name: getUserName(user),
        comment,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket-comments", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao comentar: " + error.message);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("support_ticket_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket-comments", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir comentário: " + error.message);
    },
  });

  return { comments, isLoading, addComment, deleteComment };
}
