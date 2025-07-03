import type { Player } from "../../entities/player/types"
import { CreateVideoForm } from "../../features/manage-videos/components/create-video-form"

interface AdminVideosCreatePageProps {
  players: Player[]
}

export function AdminVideosCreatePage({ players }: AdminVideosCreatePageProps) {
  return (
    <div className="w-full">
      <CreateVideoForm players={players} />
    </div>
  )
}
