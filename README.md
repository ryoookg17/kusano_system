# くさの書店 管理システム (Kusano System)

長崎市の本屋「くさの書店」の学校図書注文・補助教材管理・郵送依頼システムです。

## プロジェクト構成

このプロジェクトは Monorepo 構成になっています。

- `apps/storefront`: 一般利用者・先生向けの注文フォーム (Next.js)
- `apps/admin`: 書店スタッフ向けの管理画面 (Next.js)
- `packages/shared`: 共有ライブラリ・定数 (TypeScript)
- `supabase`: データベーススキーマ・設定

## 開発環境の実行

ルートディレクトリで以下を実行します：

```bash
npm install
npm run dev
```

- フロントエンド: [http://localhost:3000](http://localhost:3000)
- 管理画面: [http://localhost:3001](http://localhost:3001)

## デプロイ (Netlify / Vercel)

このリポジトリを GitHub にプッシュし、Netlify 等で各アプリをデプロイしてください。
環境変数として Supabase の URL と Anon Key が必要です。
