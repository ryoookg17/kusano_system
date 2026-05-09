-- access_keys テーブルに遷移先（target_value）カラムを追加
ALTER TABLE access_keys ADD COLUMN IF NOT EXISTS target_value TEXT;

-- 郵送依頼の特定学校用アクセスコードを初期登録
INSERT INTO access_keys (key_type, access_code, target_value) VALUES 
('shipping_industrial', '04', '長崎工業高校'),
('shipping_north', '05', '長崎北高校'),
('shipping_seiun', '06', '青雲高校'),
('shipping_chinzei', '07', '鎮西高校')
ON CONFLICT (key_type) DO UPDATE SET 
  access_code = EXCLUDED.access_code,
  target_value = EXCLUDED.target_value;
