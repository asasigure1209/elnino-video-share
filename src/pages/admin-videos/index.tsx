import type { VideoWithPlayers } from "../../entities/video/api"
import { VideoList } from "../../features/manage-videos/components/video-list"

interface AdminVideosPageProps {
  videos: VideoWithPlayers[]
}

export function AdminVideosPage({ videos }: AdminVideosPageProps) {
  return (
    <div className="w-full">
      <VideoList videos={videos} />
    </div>
  )
}
