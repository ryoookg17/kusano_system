-- ==========================================
-- くさの書店：郵送依頼 データベース構築用SQL
-- Supabaseの「SQL Editor」に貼り付けて実行してください。
-- ==========================================

-- 1. 郵送依頼テーブル (shipping_requests)
-- ※ 教材等のように明細が分かれないため、1つのテーブルだけで管理します
CREATE TABLE public.shipping_requests (
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
    remarks TEXT
);

-- ==========================================
-- セキュリティと権限設定 (Row Level Security)
-- 顧客（ログインなし）が依頼内容を追加できるように設定します
-- ==========================================
ALTER TABLE public.shipping_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to shipping_requests" 
ON public.shipping_requests FOR INSERT TO anon WITH CHECK (true);
