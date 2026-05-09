-- 既存の材マスタデータの大カテゴリを一括補完する
-- subjects_master (マスタ) の large_category を materials_master (既存データ) に反映

UPDATE public.materials_master m
SET large_category = s.large_category
FROM public.subjects_master s
WHERE m.subject = s.name
  AND (m.large_category IS NULL OR m.large_category = '');

-- ヒント: 完全に強制上書きしたい場合は、AND以降の条件を外して実行してください。
