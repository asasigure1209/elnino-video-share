import { AdminNavigation } from "../../widgets/admin-navigation"

export function AdminDashboardPage() {
  return (
    <div className="w-full">
      {/* 管理者ダッシュボードタイトル */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-primary mb-2">
          管理者ダッシュボード
        </h1>
        <p className="text-on-surface/70">プレイヤーや動画の管理を行えます</p>
      </div>

      {/* ナビゲーション */}
      <AdminNavigation />
    </div>
  )
}
