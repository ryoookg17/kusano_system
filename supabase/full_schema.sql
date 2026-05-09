-- ======================================================
-- くさの書店：統合データベーススキーマ (v1.0)
-- 補助教材、学校図書、郵送依頼、お知らせ、アクセスキー
-- ======================================================

-- 1. お知らせ (announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_urls TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT TRUE
);

-- 2. 補助教材注文 (textbook_orders)
CREATE TABLE IF NOT EXISTS public.textbook_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    school_name TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    email TEXT,
    school_phone TEXT NOT NULL,
    personal_phone TEXT,
    status TEXT DEFAULT '未対応'
);

-- 3. 補助教材注文明細 (textbook_order_items)
CREATE TABLE IF NOT EXISTS public.textbook_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.textbook_orders(id) ON DELETE CASCADE,
    textbook_name TEXT NOT NULL,
    publisher TEXT NOT NULL,
    subject TEXT,
    target_grade TEXT NOT NULL,
    student_quantity INTEGER NOT NULL DEFAULT 0,
    teacher_quantity INTEGER NOT NULL DEFAULT 0,
    main_item_type TEXT NOT NULL, 
    answer_type TEXT NOT NULL, 
    answer_attached TEXT, 
    accessory_type TEXT NOT NULL, 
    accessory_attached TEXT, 
    delivery_method TEXT NOT NULL, 
    billing_target TEXT,
    requested_date DATE, 
    unit_price INTEGER,
    remarks TEXT
);

-- 4. 学校図書注文 (schoolbook_orders)
CREATE TABLE IF NOT EXISTS public.schoolbook_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    school_type TEXT NOT NULL,
    school_area TEXT,
    school_name TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    email TEXT NOT NULL,
    school_phone TEXT NOT NULL,
    personal_phone TEXT,
    status TEXT DEFAULT '未対応',
    remarks TEXT
);

-- 5. 学校図書注文明細 (schoolbook_order_items)
CREATE TABLE IF NOT EXISTS public.schoolbook_order_items (
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

-- 6. 郵送依頼 (shipping_requests)
CREATE TABLE IF NOT EXISTS public.shipping_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    school_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    course TEXT,
    student_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    zipcode TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT '未対応',
    remarks TEXT
);

-- 7. アクセスキー・合言葉 (access_keys)
CREATE TABLE IF NOT EXISTS public.access_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_type TEXT UNIQUE NOT NULL, -- 'textbook', 'schoolbook', 'shipping'
    access_code TEXT NOT NULL,
    target_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ======================================================
-- Row Level Security (RLS) 設定
-- ======================================================

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textbook_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textbook_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schoolbook_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schoolbook_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- お知らせ：全ユーザー読み取り可、匿名操作可（開発用）
CREATE POLICY "Allow public read to announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow anon all to announcements" ON public.announcements FOR ALL TO anon USING (true) WITH CHECK (true);

-- 補助教材：匿名追加・読み取り・更新可（管理用含む）
CREATE POLICY "Allow anon insert to textbook_orders" ON public.textbook_orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select to textbook_orders" ON public.textbook_orders FOR SELECT USING (true);
CREATE POLICY "Allow anon update to textbook_orders" ON public.textbook_orders FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete to textbook_orders" ON public.textbook_orders FOR DELETE USING (true);

CREATE POLICY "Allow anon insert to textbook_order_items" ON public.textbook_order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select to textbook_order_items" ON public.textbook_order_items FOR SELECT USING (true);
CREATE POLICY "Allow anon update to textbook_order_items" ON public.textbook_order_items FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete to textbook_order_items" ON public.textbook_order_items FOR DELETE USING (true);

-- 学校図書：匿名追加・読み取り・更新可
CREATE POLICY "Allow anon insert to schoolbook_orders" ON public.schoolbook_orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select to schoolbook_orders" ON public.schoolbook_orders FOR SELECT USING (true);
CREATE POLICY "Allow anon update to schoolbook_orders" ON public.schoolbook_orders FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete to schoolbook_orders" ON public.schoolbook_orders FOR DELETE USING (true);

CREATE POLICY "Allow anon insert to schoolbook_order_items" ON public.schoolbook_order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select to schoolbook_order_items" ON public.schoolbook_order_items FOR SELECT USING (true);
CREATE POLICY "Allow anon delete to schoolbook_order_items" ON public.schoolbook_order_items FOR DELETE USING (true);

-- 郵送依頼：匿名追加・読み取り・更新可
CREATE POLICY "Allow anon insert to shipping_requests" ON public.shipping_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select to shipping_requests" ON public.shipping_requests FOR SELECT USING (true);
CREATE POLICY "Allow anon update to shipping_requests" ON public.shipping_requests FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete to shipping_requests" ON public.shipping_requests FOR DELETE USING (true);

-- アクセスキー：読み取り可（匿名照合用）
CREATE POLICY "Allow public read to access_keys" ON public.access_keys FOR SELECT USING (true);

-- 初期アクセスキー設定
INSERT INTO public.access_keys (key_type, access_code) VALUES 
('textbook', '01'),
('schoolbook', '02'),
('shipping', '03')
ON CONFLICT (key_type) DO NOTHING;
