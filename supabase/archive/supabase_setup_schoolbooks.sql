-- ==========================================
-- くさの書店：学校図書 データベース構築用SQL
-- Supabaseの「SQL Editor」に貼り付けて実行してください。
-- ==========================================

-- 1. 注文ごとの共通テーブル (schoolbook_orders)
CREATE TABLE public.schoolbook_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    school_type TEXT NOT NULL,
    school_area TEXT,
    school_name TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    email TEXT NOT NULL,
    school_phone TEXT NOT NULL,
    personal_phone TEXT
);

-- 2. 注文明細（図書ごとのテーブル） (schoolbook_order_items)
CREATE TABLE public.schoolbook_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.schoolbook_orders(id) ON DELETE CASCADE,
    serial_number INTEGER NOT NULL,
    book_title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    price_excluding_tax INTEGER,
    price_including_tax INTEGER,
    isbn TEXT,
    quantity INTEGER NOT NULL DEFAULT 1
);

-- ==========================================
-- セキュリティと権限設定 (Row Level Security)
-- 顧客（ログインなし）が注文を追加できるように設定します
-- ==========================================
ALTER TABLE public.schoolbook_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schoolbook_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to schoolbook_orders" 
ON public.schoolbook_orders FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to schoolbook_order_items" 
ON public.schoolbook_order_items FOR INSERT TO anon WITH CHECK (true);
