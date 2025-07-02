"use client"

import { useState } from "react"
import type { Player } from "../../../entities/player/types"
import { Button } from "../../../shared/ui/button"
import { deletePlayerAction } from "../actions"

interface PlayerListProps {
  players: Player[]
}

export function PlayerList({ players }: PlayerListProps) {
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleDelete = async (player: Player) => {
    const confirmed = confirm(`「${player.name}」を削除しますか？`)
    if (!confirmed) return

    setDeleting(player.id)
    try {
      const result = await deletePlayerAction(player.id)
      if (!result.success) {
        alert(result.error || "削除に失敗しました")
      }
      // 成功時はページが自動的に再読み込みされる（revalidatePath）
    } catch (error) {
      console.error("Delete error:", error)
      alert("削除に失敗しました")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="w-full">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-on-primary">プレイヤー</h2>
        <Button href="/admin/players/new" className="px-4 py-2">
          新規作成
        </Button>
      </div>

      {/* プレイヤー一覧テーブル */}
      <div className="bg-surface rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline">
              <th className="text-left p-4 text-on-surface font-bold">No</th>
              <th className="text-left p-4 text-on-surface font-bold">
                エントリー名
              </th>
              <th className="text-right p-4 text-on-surface font-bold">
                アクション
              </th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-8 text-on-surface/70">
                  プレイヤーが登録されていません
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-outline last:border-b-0"
                >
                  <td className="p-4 text-on-surface">{player.id}</td>
                  <td className="p-4 text-on-surface">{player.name}</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        href={`/admin/players/${player.id}/edit`}
                        size="sm"
                      >
                        編集
                      </Button>
                      <Button
                        onClick={() => handleDelete(player)}
                        size="sm"
                        className="bg-red-500 text-white"
                        disabled={deleting === player.id}
                      >
                        {deleting === player.id ? "削除中..." : "削除"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
