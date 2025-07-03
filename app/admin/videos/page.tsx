import { getVideosWithPlayers } from "../../../src/entities/video/api"
import { AdminVideosPage } from "../../../src/pages/admin-videos"
import { MainLayout } from "../../../src/shared/ui"

export default async function VideosAdminPage() {
  try {
    const videos = await getVideosWithPlayers()

    return (
      <MainLayout>
        <AdminVideosPage videos={videos} />
      </MainLayout>
    )
  } catch (error) {
    console.error("Error loading videos:", error)
    
    return (
      <MainLayout>
        <div className="w-full text-center py-8">
          <h2 className="text-xl font-bold text-on-primary mb-4">
            エラーが発生しました
          </h2>
          <p className="text-on-surface/70">
            動画データの読み込みに失敗しました。
          </p>
        </div>
      </MainLayout>
    )
  }
}