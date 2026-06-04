
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS recovery_question text,
  ADD COLUMN IF NOT EXISTS recovery_answer_hash text;
