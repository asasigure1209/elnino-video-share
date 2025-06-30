import { getPlayerById } from "../../entities/player/api"
import { getVideosByPlayerId } from "../../entities/player-video/api"
import { VideoList } from "../../widgets/video-list"

interface PlayerDetailPageProps {
  playerId: string
}

export async function PlayerDetailPage({ playerId }: PlayerDetailPageProps) {
  const id = Number(playerId)

  if (Number.isNaN(id)) {
    return (
      <div className="text-center py-8">
        <p className="text-on-surface text-lg mb-4">無効なプレイヤーIDです</p>
      </div>
    )
  }

  try {
    const [player, videos] = await Promise.all([
      getPlayerById(id),
      getVideosByPlayerId(id),
    ])

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
        <VideoList videos={videos} />
      </div>
    )
  } catch (error) {
    console.error("Failed to load player detail:", error)
    return (
      <div className="text-center py-8">
        <p className="text-on-surface text-lg mb-4">
          プレイヤーデータの読み込みに失敗しました
        </p>
        <p className="text-on-surface/70">
          しばらく時間をおいてから再度お試しください
        </p>
      </div>
    )
  }
}
