-- materials_master テーブルに本体価格（price_base）カラムを追加
ALTER TABLE public.materials_master ADD COLUMN IF NOT EXISTS price_base INTEGER;

-- コメント追加
COMMENT ON COLUMN public.materials_master.price_base IS '本体価格（副教材用）';
