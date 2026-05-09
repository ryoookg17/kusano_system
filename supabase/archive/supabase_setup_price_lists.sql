-- ==========================================
-- くさの書店：定価表作成システム データベース構築用SQL
-- ==========================================

-- 1. 共通教材マスタ (materials_master)
CREATE TABLE public.materials_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    publisher TEXT NOT NULL,
    price_tax_incl INTEGER, -- 定価(税込)
    isbn TEXT,
    textbook_number TEXT, -- 教科書番号 (教科書のみ)
    category TEXT NOT NULL CHECK (category IN ('教科書', '副教材')),
    has_answer BOOLEAN DEFAULT false -- 解答の有無（主に副教材用）
);

-- RLS
ALTER TABLE public.materials_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous select from materials_master" ON public.materials_master FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous all to materials_master" ON public.materials_master FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. 学校別定価表ヘッダー (price_lists)
CREATE TABLE public.price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    school_name TEXT NOT NULL,
    academic_year INTEGER NOT NULL -- 対象年度 (例: 2025)
);

ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous all to price_lists" ON public.price_lists FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. 定価表明細 (price_list_items)
-- 定価表に登録される1行分（＝1つの教材）
CREATE TABLE public.price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials_master(id) ON DELETE CASCADE,
    total_quantity INTEGER, -- A表などで指定された合計数
    include_answer BOOLEAN DEFAULT false, -- 今回の定価表で解答をつけるかどうか
    custom_price_tax_incl INTEGER -- 必要ならマスタの金額を上書き（任意）
);

ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous all to price_list_items" ON public.price_list_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. 学校のコース定義 (school_courses_config) - 補足用
-- 学校が持つコースのマスター的扱い
CREATE TABLE public.school_courses_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    UNIQUE(school_name, course_name)
);
ALTER TABLE public.school_courses_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous all to school_courses_config" ON public.school_courses_config FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. 教材とコースの紐付け (price_list_item_courses)
-- どの明細(教材)がどのコースで使用されるか (チェックボックスの状態を保存)
CREATE TABLE public.price_list_item_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_item_id UUID NOT NULL REFERENCES public.price_list_items(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    estimated_student_count INTEGER -- この教材から推測される、または確定したこのコースの人数
);

ALTER TABLE public.price_list_item_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous all to price_list_item_courses" ON public.price_list_item_courses FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. コース別確定人数 (price_list_course_counts)
-- ユーザーが推測ロジックを経て確定させたコースごとの人数
CREATE TABLE public.price_list_course_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    confirmed_count INTEGER NOT NULL,
    UNIQUE(price_list_id, course_name)
);

ALTER TABLE public.price_list_course_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous all to price_list_course_counts" ON public.price_list_course_counts FOR ALL TO anon USING (true) WITH CHECK (true);
