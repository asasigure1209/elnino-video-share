"use client"

import { useState } from "react"
import type { VideoWithPlayers } from "../../../entities/video/api"
import { Button } from "../../../shared/ui/button"
import { deleteVideoAction } from "../actions"

interface VideoListProps {
  videos: VideoWithPlayers[]
}

export function VideoList({ videos }: VideoListProps) {
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleDelete = async (video: VideoWithPlayers) => {
    const confirmed = confirm(
      `「${video.name}」を削除しますか？\n※この操作は取り消せません。`,
    )
    if (!confirmed) return

    setDeleting(video.id)
    try {
      const result = await deleteVideoAction(video.id)
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
        <h2 className="text-xl font-bold text-on-primary">動画</h2>
        <Button href="/admin/videos/new" className="px-4 py-2">
          新規作成
        </Button>
      </div>

      {/* 動画一覧テーブル */}
      <div className="bg-surface rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline">
              <th className="text-left p-4 text-on-surface font-bold">ID</th>
              <th className="text-left p-4 text-on-surface font-bold">
                ファイル名
              </th>
              <th className="text-left p-4 text-on-surface font-bold">
                タイプ
              </th>
              <th className="text-left p-4 text-on-surface font-bold">
                プレイヤー
              </th>
              <th className="text-right p-4 text-on-surface font-bold">
                アクション
              </th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-on-surface/70">
                  動画が登録されていません
                </td>
              </tr>
            ) : (
              videos.map((video) => (
                <tr
                  key={video.id}
                  className="border-b border-outline last:border-b-0"
                >
                  <td className="p-4 text-on-surface">{video.id}</td>
                  <td className="p-4 text-on-surface">
                    <div className="max-w-xs truncate" title={video.name}>
                      {video.name}
                    </div>
                  </td>
                  <td className="p-4 text-on-surface">
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded text-sm">
                      {video.type}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface">
                    <div className="flex flex-wrap gap-1">
                      {video.players.length === 0 ? (
                        <span className="text-on-surface/50 text-sm">
                          未割当
                        </span>
                      ) : (
                        video.players.map((player) => (
                          <span
                            key={player.id}
                            className="px-2 py-1 bg-secondary/20 text-secondary rounded text-sm"
                          >
                            {player.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button href={`/admin/videos/${video.id}/edit`} size="sm">
                        編集
                      </Button>
                      <Button
                        onClick={() => handleDelete(video)}
                        size="sm"
                        className="bg-red-500 text-white"
                        disabled={deleting === video.id}
                      >
                        {deleting === video.id ? "削除中..." : "削除"}
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
