import type { Player } from "../../entities/player/types"
import type { Video } from "../../entities/video/types"
import { EditVideoForm } from "../../features/manage-videos/components/edit-video-form"

interface AdminVideosEditPageProps {
  video: Video
  players: Player[]
  selectedPlayerIds: number[]
}

export function AdminVideosEditPage({
  video,
  players,
  selectedPlayerIds,
}: AdminVideosEditPageProps) {
  return (
    <div className="w-full">
      <EditVideoForm
        video={video}
        players={players}
        selectedPlayerIds={selectedPlayerIds}
      />
    </div>
  )
}
