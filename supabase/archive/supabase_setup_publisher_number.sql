-- materials_master テーブルに出版社番号（publisher_number）カラムを追加するSQL
ALTER TABLE materials_master
ADD COLUMN publisher_number TEXT;
