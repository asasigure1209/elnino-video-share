import type { Player } from "../../entities/player/types"
import { Button } from "../../shared/ui/button"

interface PlayerListProps {
  players: Player[]
}

export function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="w-full">
      {/* テーブルヘッダー */}
      <div className="grid grid-cols-3 gap-4 pb-4 border-b border-on-surface mb-3">
        <div className="text-on-surface font-bold text-left">No</div>
        <div className="text-on-surface font-bold text-left">エントリー名</div>
        <div className="text-on-surface font-bold text-center"></div>
      </div>

      {/* プレイヤー一覧 */}
      <div>
        {players.map((player) => (
          <div
            key={player.id}
            className="grid grid-cols-3 gap-4 items-center py-3"
          >
            <div className="text-on-surface text-lg">{player.id}</div>
            <div className="text-on-surface text-lg">{player.name}</div>
            <div className="text-center">
              <Button
                href={`/players/${player.id}`}
                size="sm"
                className="min-w-[60px]"
              >
                動画
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
