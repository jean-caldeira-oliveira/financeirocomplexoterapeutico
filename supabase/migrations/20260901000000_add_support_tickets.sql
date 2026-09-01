-- Migration: Add support tickets (Kanban board) and their comments
-- Tickets are shared clinic data: any authenticated user can create/read/comment,
-- but only admins can move a ticket between board columns or delete tickets/comments.

CREATE TABLE public.support_tickets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id),
  user_name     TEXT,
  ticket_type   TEXT        NOT NULL CHECK (ticket_type IN (
                  'nova_funcionalidade', 'correcao_bug', 'duvida', 'ajuste'
                )),
  severity      TEXT        NOT NULL CHECK (severity IN (
                  'bloqueio', 'alta', 'media', 'baixa'
                )),
  tab           TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'triagem' CHECK (status IN (
                  'triagem', 'em_desenvolvimento', 'validacao', 'concluido'
                )),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX support_tickets_status_idx ON public.support_tickets(status);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read support_tickets"
ON public.support_tickets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert support_tickets"
ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update support_tickets"
ON public.support_tickets FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete support_tickets"
ON public.support_tickets FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.support_ticket_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  user_name   TEXT,
  comment     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX support_ticket_comments_ticket_id_idx ON public.support_ticket_comments(ticket_id);

ALTER TABLE public.support_ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read support_ticket_comments"
ON public.support_ticket_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert support_ticket_comments"
ON public.support_ticket_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete support_ticket_comments"
ON public.support_ticket_comments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
