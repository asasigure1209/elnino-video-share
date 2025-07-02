import type { Player } from "../../entities/player/types"
import { EditPlayerForm } from "../../features/manage-players/components/edit-player-form"

interface AdminPlayersEditPageProps {
  player: Player
}

export function AdminPlayersEditPage({ player }: AdminPlayersEditPageProps) {
  return (
    <div className="w-full">
      <EditPlayerForm player={player} />
    </div>
  )
}
