-- 補助教材注文アイテムテーブルに「教科」と「本体価格」カラムを追加するSQL
ALTER TABLE public.textbook_order_items ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.textbook_order_items ADD COLUMN IF NOT EXISTS unit_price INTEGER;
