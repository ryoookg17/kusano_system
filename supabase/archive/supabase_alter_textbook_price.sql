-- ==========================================
-- くさの書店：補助教材 データベース拡張
-- 本体価格(unit_price)の追加
-- ==========================================

ALTER TABLE public.textbook_order_items ADD COLUMN IF NOT EXISTS unit_price INTEGER;
