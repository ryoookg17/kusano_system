-- ==========================================
-- くさの書店：管理者画面用「ステータス」追加SQL
-- ※以前作成した3つのテーブルに「対応状態」を管理する枠を追加します
-- ==========================================

ALTER TABLE public.textbook_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '未対応';
ALTER TABLE public.schoolbook_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '未対応';
ALTER TABLE public.shipping_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '未対応';

-- ※今後Admin画面からのステータス変更等に備え、全読み取り(SELECT)および書き込み(UPDATE)を許可するポリシーも追加しておきます（管理用）
-- 一時的な運用としてanonに許可していますが、本番運用時は認証ユーザー専用に切り替えます

CREATE POLICY "Allow anonymous select to textbook_orders" ON public.textbook_orders FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update to textbook_orders" ON public.textbook_orders FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select to schoolbook_orders" ON public.schoolbook_orders FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update to schoolbook_orders" ON public.schoolbook_orders FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select to shipping_requests" ON public.shipping_requests FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update to shipping_requests" ON public.shipping_requests FOR UPDATE USING (true);

-- 明細の読み取り用
CREATE POLICY "Allow anonymous select to textbook_order_items" ON public.textbook_order_items FOR SELECT USING (true);
CREATE POLICY "Allow anonymous select to schoolbook_order_items" ON public.schoolbook_order_items FOR SELECT USING (true);
