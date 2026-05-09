-- price_lists テーブルに grade（学年）カラムを追加
ALTER TABLE public.price_lists ADD COLUMN IF NOT EXISTS grade TEXT;

-- コメント追加
COMMENT ON COLUMN public.price_lists.grade IS '対象学年（例: 1年, 2年, 3年）';
