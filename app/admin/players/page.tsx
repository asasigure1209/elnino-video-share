import { getPlayers } from "../../../src/entities/player/api"
import { AdminPlayersPage } from "../../../src/pages/admin-players"
import { MainLayout } from "../../../src/shared/ui"

export default async function PlayersAdminPage() {
  try {
    const players = await getPlayers()

    return (
      <MainLayout>
        <AdminPlayersPage players={players} />
      </MainLayout>
    )
  } catch (error) {
    console.error("Error loading players:", error)
    
    return (
      <MainLayout>
        <div className="w-full text-center py-8">
          <h2 className="text-xl font-bold text-on-primary mb-4">
            エラーが発生しました
          </h2>
          <p className="text-on-surface/70">
            プレイヤーデータの読み込みに失敗しました。
          </p>
        </div>
      </MainLayout>
    )
  }
}