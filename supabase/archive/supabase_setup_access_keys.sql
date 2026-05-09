-- アクセスキー（合言葉）を管理するためのテーブル
CREATE TABLE IF NOT EXISTS access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_type TEXT UNIQUE NOT NULL, -- 'textbook', 'schoolbook', 'shipping'
  access_code TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS（行レベルセキュリティ）の設定：管理者はすべて可能、一般ユーザーは読み取りのみ可能とする
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み取り許可（認証時に照合するため）
CREATE POLICY "Allow public read access" ON access_keys
  FOR SELECT USING (true);

-- 管理者ロール等の制限は後ほど追加可能ですが、一旦サービスロール等での操作を想定

-- 初期テストデータの挿入
INSERT INTO access_keys (key_type, access_code) VALUES 
('textbook', '01'),
('schoolbook', '02'),
('shipping', '03')
ON CONFLICT (key_type) DO UPDATE SET access_code = EXCLUDED.access_code;
