import { Button } from "../../shared/ui/button"

export function AdminNavigation() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* プレイヤー管理ボタン */}
      <div className="w-full">
        <Button
          href="/admin/players"
          className="w-full py-4 text-lg text-center font-bold block"
        >
          プレイヤー
        </Button>
      </div>

      {/* 動画管理ボタン */}
      <div className="w-full">
        <Button
          href="/admin/videos"
          className="w-full py-4 text-lg text-center font-bold block"
        >
          動画
        </Button>
      </div>
    </div>
  )
}
