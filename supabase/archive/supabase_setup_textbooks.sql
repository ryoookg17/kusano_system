-- ==========================================
-- くさの書店：補助教材 データベース構築用SQL
-- Supabaseの「SQL Editor」に貼り付けて実行してください。
-- ==========================================

-- 1. 注文ごとの共通テーブル (textbook_orders)
CREATE TABLE public.textbook_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    school_name TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    email TEXT NOT NULL,
    school_phone TEXT NOT NULL,
    personal_phone TEXT
);

-- 2. 注文明細（教材ごとのテーブル） (textbook_order_items)
CREATE TABLE public.textbook_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.textbook_orders(id) ON DELETE CASCADE,
    textbook_name TEXT NOT NULL,
    publisher TEXT NOT NULL,
    target_grade TEXT NOT NULL,
    student_quantity INTEGER NOT NULL DEFAULT 0,
    teacher_quantity INTEGER NOT NULL DEFAULT 0,
    main_item_type TEXT NOT NULL, 
    answer_type TEXT NOT NULL, 
    answer_attached TEXT, 
    accessory_type TEXT NOT NULL, 
    accessory_attached TEXT, 
    delivery_method TEXT NOT NULL, 
    requested_date DATE, 
    remarks TEXT
);

-- ==========================================
-- セキュリティと権限設定 (Row Level Security)
-- 顧客（ログインなし）が注文を追加できるように設定します
-- ==========================================
ALTER TABLE public.textbook_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textbook_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to textbook_orders" 
ON public.textbook_orders FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to textbook_order_items" 
ON public.textbook_order_items FOR INSERT TO anon WITH CHECK (true);

-- （今後の開発のために）管理者がすべてを読み取れるポリシー等も後日追加します
