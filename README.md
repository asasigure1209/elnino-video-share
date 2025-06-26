# エルニーニョ動画配布サイト

ヲタ芸バトルイベント「エルニーニョ」の動画配布サイトです。プレイヤーが自分の動画をダウンロードできるユーザー機能と、管理者が動画・プレイヤーを管理できる管理機能を提供します。

## 技術スタック

- **フロントエンド**: Next.js (TypeScript) + Tailwind CSS
- **バックエンド**: Next.js Route Handlers
- **データベース**: Google Sheets (players, videos, player_videos の3シート)
- **ファイルストレージ**: Cloudflare R2
- **認証**: Basic認証（管理者機能）
- **テスト**: Vitest + @testing-library/react
- **リンター**: Biome
- **ホスティング**: AppRun (さくらインターネット)

## 開発環境のセットアップ

### 前提条件
- Node.js v20以上
- npm

### 1. リポジトリのクローン
```bash
git clone https://github.com/asasigure1209/elnino-video-share.git
cd elnino-video-share
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスして確認できます。

## 開発コマンド

### 基本コマンド
```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

### テスト実行
```bash
# 全テスト実行
npm test

# ウォッチモードでテスト実行
npm run test:watch

# UI付きでテスト実行
npm run test:ui
```

### リントチェック・フォーマット
```bash
# リントチェック実行
npm run lint

# コードフォーマット実行
npm run format

# リントチェック + 自動修正
npm run check
```
