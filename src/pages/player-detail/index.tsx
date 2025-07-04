import type { Player } from "../../entities/player/types"
import { VideoList } from "../../widgets/video-list"

export async function PlayerDetailPage({
  player,
}: {
  player: Player | undefined
}) {
  if (!player) {
    return (
      <div className="text-center py-8">
        <p className="text-on-surface text-lg mb-4">
          プレイヤーが見つかりませんでした
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* プレイヤー名表示 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-on-primary">{player.name}</h2>
      </div>

      {/* 動画一覧 */}
      <VideoList videos={player.videos} />
    </div>
  )
}
