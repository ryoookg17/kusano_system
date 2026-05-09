-- ==========================================
-- 教科名タグ用マスタテーブル (subjects_master)
-- ==========================================

CREATE TABLE public.subjects_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

-- RLS設定 (公開アクセス許可)
ALTER TABLE public.subjects_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous all to subjects_master" ON public.subjects_master FOR ALL TO anon USING (true) WITH CHECK (true);

-- 初期データの流し込み
INSERT INTO public.subjects_master (name, order_index) VALUES
    ('国語', 10),
    ('論理国語', 20),
    ('数学', 30),
    ('物理', 40),
    ('化学', 50),
    ('生物', 60),
    ('地理総合', 70),
    ('地理探究', 80),
    ('歴史総合', 90),
    ('世界史探究', 100),
    ('日本史探究', 110),
    ('公共', 120),
    ('倫理', 130),
    ('政治・経済', 140),
    ('英語', 150),
    ('家庭科', 160),
    ('保健体育', 170),
    ('音楽', 180),
    ('美術', 190),
    ('情報', 200);
