-- 1. 古い「副教材」しか許可しない制限（CHECK制約）を取り外します
ALTER TABLE materials_master DROP CONSTRAINT IF EXISTS materials_master_category_check;

-- 2. 登録済みの「副教材」という文字を「補助教材」に書き換えます
UPDATE materials_master SET category = '補助教材' WHERE category = '副教材';

-- 3. （安全のため）今後は「教科書」か「補助教材」だけを許可するよう再設定します
ALTER TABLE materials_master ADD CONSTRAINT materials_master_category_check CHECK (category IN ('教科書', '補助教材'));
