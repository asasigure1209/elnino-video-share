# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトはヲタ芸バトルイベント「エルニーニョ」の動画配布サイトです。プレイヤーが自分の動画をダウンロードできるユーザー機能と、管理者が動画・プレイヤーを管理できる管理機能を提供します。

## アーキテクチャ

### 技術スタック
- **フロントエンド**: Next.js (TypeScript) + Tailwind CSS
- **バックエンド**: Next.js App Router + React Server Components + Server Actions
- **データベース**: Google Sheets (players, videos, player_videos の3シート)
- **ファイルストレージ**: Cloudflare R2
- **認証**: middleware.ts によるBasic認証（管理者機能）
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

## 実装パターン

### Server Components でのデータフェッチ
```typescript
// app/page.tsx (プレイヤー一覧)
import { getPlayers } from '@/src/entities/player/api'

export default async function HomePage() {
  const players = await getPlayers()
  
  return (
    <div>
      {players.map(player => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  )
}
```

### Server Actions でのフォーム処理
```typescript
// app/admin/players/new/page.tsx
import { createPlayer } from '@/src/features/manage-players/actions'

export default function CreatePlayerPage() {
  return (
    <form action={createPlayer}>
      <input name="name" required />
      <button type="submit">作成</button>
    </form>
  )
}

// src/features/manage-players/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { savePlayer } from '@/src/entities/player/api'

export async function createPlayer(formData: FormData) {
  const name = formData.get('name') as string
  await savePlayer({ name })
  redirect('/admin/players')
}
```

### middleware.ts での認証
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = request.headers.get('authorization')
    
    if (!basicAuth) {
      return new NextResponse('認証が必要です', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      })
    }
    
    // Basic認証の検証ロジック
    const authValue = basicAuth.split(' ')[1]
    const [user, password] = atob(authValue).split(':')
    
    if (user !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD) {
      return new NextResponse('認証失敗', { status: 401 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}
```

## 開発手順

- 工程が完了したタイミングで実装工程表にチェックを付ける: @requirements/02_実装工程表.md

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

## アーキテクチャ設計

### データアクセス（Server Components）
- **ユーザー機能**: Server Components内で直接データフェッチ
  - プレイヤー一覧取得
  - プレイヤー別動画一覧取得
  - 動画ダウンロードURL生成
- **管理者機能**: middleware.ts による認証後、Server Components でデータフェッチ

### データ操作（Server Actions）
- **プレイヤー管理**: 作成・更新・削除
- **動画管理**: 登録（R2アップロード含む）・更新・削除
- **認証**: middleware.ts でパス単位の認証制御

### キャッシュ戦略
- Next.js 14+ の cache API を活用
- Google Sheets API 制限対策
- 適切な revalidate 設定

## プロジェクト構造（Next.js App Router + FSD）

```
プロジェクトルート/
├── app/                      # Next.js App Router (ルート)
│   ├── layout.tsx           # Next.js グローバルレイアウト
│   ├── page.tsx             # ホームページルート
│   ├── players/
│   │   └── [id]/
│   │       └── page.tsx     # プレイヤー詳細ページ
│   └── admin/
│       ├── layout.tsx       # 管理者レイアウト
│       ├── page.tsx         # 管理ダッシュボード
│       ├── players/
│       │   ├── page.tsx     # プレイヤー管理一覧
│       │   ├── new/
│       │   │   └── page.tsx # プレイヤー作成
│       │   └── [id]/
│       │       └── edit/
│       │           └── page.tsx # プレイヤー編集
│       └── videos/
│           ├── page.tsx     # 動画管理一覧
│           ├── new/
│           │   └── page.tsx # 動画登録
│           └── [id]/
│               └── edit/
│                   └── page.tsx # 動画編集
├── src/                     # FSD アーキテクチャ
│   ├── app/                 # FSD app レイヤー
│   │   ├── providers/       # React Context, state管理
│   │   ├── styles/          # グローバルスタイル
│   │   └── config/          # アプリ設定
│   ├── pages/               # FSD pages レイヤー
│   │   ├── home/            # ホームページロジック
│   │   ├── player-detail/   # プレイヤー詳細ロジック
│   │   └── admin-dashboard/ # 管理画面ロジック
│   ├── widgets/             # 複合UIコンポーネント
│   │   ├── player-list/     # プレイヤー一覧
│   │   ├── video-list/      # 動画一覧
│   │   └── admin-nav/       # 管理ナビゲーション
│   ├── features/            # ビジネス機能
│   │   ├── download-video/  # 動画ダウンロード
│   │   ├── manage-players/  # プレイヤー管理
│   │   │   ├── actions.ts   # Server Actions
│   │   │   └── components/  # UI Components
│   │   ├── manage-videos/   # 動画管理
│   │   │   ├── actions.ts   # Server Actions
│   │   │   └── components/  # UI Components
│   │   └── auth/           # 認証
│   ├── entities/            # ビジネスエンティティ
│   │   ├── player/         # プレイヤーモデル
│   │   │   ├── types.ts    # 型定義
│   │   │   └── api.ts      # データアクセス
│   │   ├── video/          # 動画モデル
│   │   │   ├── types.ts    # 型定義
│   │   │   └── api.ts      # データアクセス
│   │   └── user/           # ユーザーモデル
│   └── shared/             # 共通モジュール
│       ├── ui/             # UIコンポーネント
│       ├── lib/            # ユーティリティ
│       ├── api/            # Google Sheets, R2 API基盤
│       └── config/         # 設定
├── middleware.ts           # 認証ミドルウェア
└── tests/                  # Playwright E2Eテスト
```

### Next.js App Router ← FSD Pages の統合
```typescript
// app/page.tsx (Next.js Router)
import { HomePage } from '@/src/pages/home'

export default function RootPage() {
  return <HomePage />
}

// app/players/[id]/page.tsx
import { PlayerDetailPage } from '@/src/pages/player-detail'

export default function PlayerPage({ params }: { params: { id: string } }) {
  return <PlayerDetailPage playerId={params.id} />
}
```

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