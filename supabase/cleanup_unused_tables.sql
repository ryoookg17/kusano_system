-- ======================================================
-- くさの書店：未使用テーブル クリーンアップスクリプト
-- ※現在アプリケーションで使用されていないテーブルを削除します。
-- ======================================================

-- 1. 定価表・教材マスタ関連（削除）
DROP TABLE IF EXISTS public.price_list_course_counts CASCADE;
DROP TABLE IF EXISTS public.price_list_item_courses CASCADE;
DROP TABLE IF EXISTS public.school_courses_config CASCADE;
DROP TABLE IF EXISTS public.price_list_items CASCADE;
DROP TABLE IF EXISTS public.price_lists CASCADE;
DROP TABLE IF EXISTS public.materials_master CASCADE;

-- 2. マスタ関連（削除：現在は使用していません）
DROP TABLE IF EXISTS public.subjects_master CASCADE;
DROP TABLE IF EXISTS public.publishers_master CASCADE;
DROP TABLE IF EXISTS public.school_keys CASCADE; -- access_keysに移行済み
DROP TABLE IF EXISTS public.school_level CASCADE;
DROP TABLE IF EXISTS public.publisher_number CASCADE;
DROP TABLE IF EXISTS public.subject CASCADE;
DROP TABLE IF EXISTS public.edition CASCADE;
DROP TABLE IF EXISTS public.category CASCADE;
DROP TABLE IF EXISTS public.large_categories CASCADE;

-- 完了メッセージ
-- （SQL Editorで実行した際、正常に終了すれば対象テーブルが削除されています）
