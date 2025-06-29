import { getPlayers } from "../../entities/player/api"
import { PlayerList } from "../../widgets/player-list"

export async function HomePage() {
  try {
    const players = await getPlayers()
    return <PlayerList players={players} />
  } catch (error) {
    console.error("Failed to load players:", error)
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
