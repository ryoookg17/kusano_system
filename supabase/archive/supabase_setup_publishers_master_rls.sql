-- ==========================================
-- 出版社マスタテーブル (publishers_master) RLS修正
-- ==========================================

-- テーブルにRLSが設定されている場合、公開アクセス（読み書き）を許可します
ALTER TABLE public.publishers_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous all to publishers_master" ON public.publishers_master;
CREATE POLICY "Allow anonymous all to publishers_master" ON public.publishers_master FOR ALL TO anon USING (true) WITH CHECK (true);
