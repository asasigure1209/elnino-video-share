# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトはヲタ芸バトルイベント「エルニーニョ」の動画配布サイトです。プレイヤーが自分の動画をダウンロードできるユーザー機能と、管理者が動画・プレイヤーを管理できる管理機能を提供します。

## アーキテクチャ

### 技術スタック
- **フロントエンド**: Next.js (TypeScript) + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Google Sheets (players, videos, player_videos の3シート)
- **ファイルストレージ**: Cloudflare R2
- **認証**: Basic認証（管理者機能）
- **ホスティング**: AppRun (さくらインターネット)

### データベース設計
```
players (プレイヤー情報)
├── id: プレイヤーID
└── name: プレイヤー名

videos (動画情報)
├── id: 動画ID
├── name: 動画ファイル名
└── type: 動画種別（予選|TOP16|TOP8|TOP4|3位決定戦|決勝戦）

player_videos (プレイヤー-動画の紐付け)
├── id: マッピングID
├── player_id: プレイヤーID
└── video_id: 動画ID
```

## 画面構成

### ユーザー機能
- `/`: プレイヤー一覧（エントリーNo、プレイヤー名、詳細リンク）
- `/players/[id]`: プレイヤー詳細（動画一覧とダウンロードリンク）

### 管理者機能（Basic認証必須）
- `/admin`: 管理者ダッシュボード
- `/admin/players`: プレイヤー管理（一覧、作成、編集、削除）
- `/admin/players/new`: プレイヤー作成
- `/admin/players/[id]/edit`: プレイヤー編集
- `/admin/videos`: 動画管理（一覧、登録、編集、削除）
- `/admin/videos/new`: 動画登録（R2へのアップロード含む）
- `/admin/videos/[id]/edit`: 動画編集

## 開発手順

### セットアップ（未実装プロジェクトの場合）
1. Next.js プロジェクトの初期化
2. 必要なライブラリのインストール
   - Google Sheets API関連ライブラリ
   - Cloudflare R2 SDK
   - jotai + zod（フォーム管理）
3. 外部サービス連携設定
   - Google Sheets API認証設定
   - Cloudflare R2バケット設定

### 実装優先順位
1. **MVP版**（8-10日）: ユーザー機能のみ（プレイヤー一覧・動画ダウンロード）
2. **管理者機能追加版**（+6-8日）: 管理者によるCRUD操作
3. **フル機能版**（+2-4日）: エラーハンドリング・最適化・テスト

## API設計

### 公開API
- `GET /api/players`: プレイヤー一覧取得
- `GET /api/videos?player={id}`: プレイヤー別動画一覧取得

### 管理者API（Basic認証必須）
- `GET/POST/PUT/DELETE /api/admin/players/*`: プレイヤー管理
- `GET/POST/PUT/DELETE /api/admin/videos/*`: 動画管理（R2アップロード含む）

## 注意事項

### セキュリティ
- 管理者機能には必ずBasic認証を実装
- API キーや認証情報は環境変数で管理
- ファイルアップロード時のバリデーション実装

### パフォーマンス
- Google Sheets API制限対策（キャッシュ戦略）
- 大容量動画ファイルのアップロード・ダウンロード最適化
- R2のCDN設定活用

### 運用
- エラーハンドリングの統一
- ログ出力の標準化
- モバイル対応の確保