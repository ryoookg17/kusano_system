-- isbnカラムを materials_master テーブルから完全に削除するSQLです

ALTER TABLE materials_master DROP COLUMN IF EXISTS isbn;
