# src/pages/ ディレクトリについて

このディレクトリは **Feature-Sliced Design (FSD) の pages レイヤー** です。

## 注意事項

⚠️ **このディレクトリは Next.js の Pages Router とは関係ありません**

- このプロジェクトは **Next.js App Router** を使用しています
- Pages Router のファイル（`pages/api/`, `pages/index.tsx` など）はここには配置しません
- Next.js のルーティングは `app/` ディレクトリで管理されます

## このディレクトリの目的

Feature-Sliced Design における **pages レイヤー** として使用します：

- ページ固有のビジネスロジック
- 複数の widgets や features を組み合わせた画面構成
- Next.js App Router の各ページから呼び出されるコンポーネント

## 構造例

```
src/pages/
├── home/           # ホームページ
│   └── index.tsx
├── player-detail/  # プレイヤー詳細ページ
│   └── index.tsx
└── admin-dashboard/ # 管理ダッシュボード
    └── index.tsx
```

## Next.js App Router との連携

```typescript
// app/page.tsx (Next.js App Router)
import { HomePage } from '@/src/pages/home'

export default function RootPage() {
  return <HomePage />
}
```