-- 1. materials_master テーブルへの大カテゴリ（large_category）追加
ALTER TABLE public.materials_master ADD COLUMN IF NOT EXISTS large_category TEXT;

-- 2. subjects_master テーブルへの大カテゴリ（large_category）追加
ALTER TABLE public.subjects_master ADD COLUMN IF NOT EXISTS large_category TEXT;

-- 3. 教科と大カテゴリの紐付け更新
-- 国語
UPDATE public.subjects_master SET large_category = '国語' WHERE name IN ('国語', '論理国語');
-- 数学
UPDATE public.subjects_master SET large_category = '数学' WHERE name IN ('数学');
-- 理科
UPDATE public.subjects_master SET large_category = '理科' WHERE name IN ('物理', '化学', '生物');
-- 社会
UPDATE public.subjects_master SET large_category = '社会' WHERE name IN ('地理総合', '地理探究', '歴史総合', '世界史探究', '日本史探究', '公共', '倫理', '政治・経済');
-- 英語
UPDATE public.subjects_master SET large_category = '英語' WHERE name IN ('英語');
-- その他
UPDATE public.subjects_master SET large_category = 'その他' WHERE name IN ('家庭科', '保健体育', '音楽', '美術', '情報');

-- 教材マスタの既存データも、教科名から推測して埋める（任意ですが利便性のため）
UPDATE public.materials_master m
SET large_category = s.large_category
FROM public.subjects_master s
WHERE m.subject = s.name AND m.large_category IS NULL;
