-- materials_master テーブルに対象校種（school_level）カラムを追加するSQL
-- 既存のデータはすべて高校向けなので、デフォルト値を '高校' とします。
ALTER TABLE materials_master
ADD COLUMN school_level TEXT DEFAULT '高校';
