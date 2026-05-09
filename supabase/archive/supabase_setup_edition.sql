-- materials_master テーブルに版/エディション（edition）カラムを追加するSQL
ALTER TABLE materials_master
ADD COLUMN IF NOT EXISTS edition TEXT;
