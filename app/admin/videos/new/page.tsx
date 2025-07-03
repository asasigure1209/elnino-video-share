import { getPlayers } from "../../../../src/entities/player/api"
import { AdminVideosCreatePage } from "../../../../src/pages/admin-videos-create"
import { MainLayout } from "../../../../src/shared/ui"

export default async function VideosCreateAdminPage() {
  try {
    const players = await getPlayers()

    return (
      <MainLayout>
        <AdminVideosCreatePage players={players} />
      </MainLayout>
    )
  } catch (error) {
    console.error("Error loading players for video creation:", error)
    
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