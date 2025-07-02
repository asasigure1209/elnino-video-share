import type { Player } from "../../entities/player/types"
import { PlayerList } from "../../features/manage-players/components/player-list"

interface AdminPlayersPageProps {
  players: Player[]
}

export function AdminPlayersPage({ players }: AdminPlayersPageProps) {
  return (
    <div className="w-full">
      <PlayerList players={players} />
    </div>
  )
}
