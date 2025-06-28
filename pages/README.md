# pages/ ディレクトリについて

⚠️ **このプロジェクトでは Pages Router を使用していません**

## 重要な注意事項

このディレクトリは **Next.js の Pages Router を無効化** するために存在します。

- **このプロジェクトは Next.js App Router を使用しています**
- ルーティングは `app/` ディレクトリで管理されます
- API Routes も `app/api/` ディレクトリで管理されます（将来的に使用する場合）

## Pages Router を使わない理由

1. **App Router が推奨**: Next.js 13+ では App Router が推奨されています
2. **React Server Components**: App Router でのみ利用可能
3. **Server Actions**: フォーム処理において型安全で効率的
4. **FSD との親和性**: Feature-Sliced Design との組み合わせが良好

## プロジェクト構造

```
├── app/                    # Next.js App Router（ルーティング）
│   ├── layout.tsx         # グローバルレイアウト
│   ├── page.tsx           # ホームページ
│   └── ...                # その他のルート
├── src/                   # Feature-Sliced Design
│   ├── pages/             # FSD pages レイヤー（Pages Router ではない）
│   ├── widgets/           # 複合UIコンポーネント
│   ├── features/          # ビジネス機能
│   ├── entities/          # エンティティ
│   └── shared/            # 共通モジュール
└── pages/                 # このディレクトリ（Pages Router 無効化用）
    └── README.md          # この説明ファイル
```

## 開発者への注意

- ページを追加する場合は `app/` ディレクトリを使用してください
- API を追加する場合は `app/api/` ディレクトリを使用してください（現在は Server Actions を推奨）
- このディレクトリ（`pages/`）には何も追加しないでください