-- ==========================================
-- お知らせ管理機能用テーブル
-- ==========================================

CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_urls TEXT[] DEFAULT '{}', -- 画像URLを配列で保存
    is_published BOOLEAN DEFAULT TRUE
);

-- Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能
CREATE POLICY "Allow public read access to announcements"
ON public.announcements FOR SELECT USING (true);

-- （開発用）匿名での追加・更新も許可
-- ※本来は認証が必要ですが、現在のプロジェクト構成に合わせています
CREATE POLICY "Allow anonymous inserts to announcements"
ON public.announcements FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous updates to announcements"
ON public.announcements FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous deletes from announcements"
ON public.announcements FOR DELETE TO anon USING (true);
