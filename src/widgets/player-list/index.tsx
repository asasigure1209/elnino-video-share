import { Button } from "../../shared/ui/button"

interface Player {
  id: number
  name: string
  entryNo: number
}

interface PlayerListProps {
  players?: Player[]
}

// モックデータ（実装工程表の次のフェーズでServer Componentから取得予定）
const mockPlayers: Player[] = [
  { id: 1, name: "るぐら", entryNo: 1 },
  { id: 2, name: "風龍", entryNo: 2 },
  { id: 3, name: "せせらぎ", entryNo: 3 },
]

export function PlayerList({ players = mockPlayers }: PlayerListProps) {
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
            <div className="text-on-surface text-lg">{player.entryNo}</div>
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
