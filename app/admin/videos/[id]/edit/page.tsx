import { notFound } from "next/navigation"
import { getPlayers } from "../../../../../src/entities/player/api"
import { getPlayerVideos } from "../../../../../src/entities/player-video/api"
import { getVideoById } from "../../../../../src/entities/video/api"
import { AdminVideosEditPage } from "../../../../../src/pages/admin-videos-edit"
import { MainLayout } from "../../../../../src/shared/ui"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VideosEditAdminPage({ params }: PageProps) {
  try {
    const { id } = await params
    const videoId = Number(id)

    // IDの妥当性チェック
    if (Number.isNaN(videoId) || videoId <= 0) {
      notFound()
    }

    // 必要なデータを並列で取得
    const [video, players, playerVideos] = await Promise.all([
      getVideoById(videoId),
      getPlayers(),
      getPlayerVideos(),
    ])

    // 動画が見つからない場合は404
    if (!video) {
      notFound()
    }

    // この動画に紐付いているプレイヤーIDを取得
    const selectedPlayerIds = playerVideos
      .filter((pv) => pv.video_id === videoId)
      .map((pv) => pv.player_id)

    return (
      <MainLayout>
        <AdminVideosEditPage 
          video={video} 
          players={players} 
          selectedPlayerIds={selectedPlayerIds} 
        />
      </MainLayout>
    )
  } catch (error) {
    console.error("Error loading video for edit:", error)
    
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