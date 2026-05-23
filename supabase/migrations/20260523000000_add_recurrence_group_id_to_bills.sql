-- Add recurrence_group_id to bills table
-- This UUID groups all bills that belong to the same recurring series,
-- enabling precise bulk-delete operations:
--   • delete only this occurrence
--   • delete this + all future occurrences
--   • delete the entire series (past + present + future)

ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS recurrence_group_id UUID;

-- Backfill: assign a shared group ID to existing recurring bills.
-- Bills are grouped by (user_id, description, category, subcategory, recurrence).
-- We generate one UUID per logical group and stamp every member row with it.
WITH groups AS (
  SELECT DISTINCT ON (user_id, description, category, subcategory, recurrence)
    user_id,
    description,
    category,
    subcategory,
    recurrence,
    gen_random_uuid() AS group_id
  FROM public.bills
  WHERE recurrence != 'none'
)
UPDATE public.bills b
SET recurrence_group_id = g.group_id
FROM groups g
WHERE b.user_id     = g.user_id
  AND b.description = g.description
  AND b.category    = g.category
  AND b.subcategory = g.subcategory
  AND b.recurrence  = g.recurrence
  AND b.recurrence  != 'none';
