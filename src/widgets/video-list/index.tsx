"use client"

import { useState } from "react"
import type { PlayerVideoWithDetails } from "../../entities/player-video/types"
import { downloadVideo } from "../../features/download-video/actions"
import { Button } from "../../shared/ui/button"

interface VideoListProps {
  videos: PlayerVideoWithDetails[]
}

export function VideoList({ videos }: VideoListProps) {
  const [downloadingVideos, setDownloadingVideos] = useState<Set<string>>(
    new Set(),
  )

  // 動画を種別でグループ化
  const groupedVideos = videos.reduce(
    (acc, video) => {
      if (!acc[video.video_type]) {
        acc[video.video_type] = []
      }
      acc[video.video_type].push(video)
      return acc
    },
    {} as Record<string, PlayerVideoWithDetails[]>,
  )

  // 動画種別の表示順序を定義
  const typeOrder = ["予選", "Best16", "Best8", "Best4", "3位決定戦", "決勝戦"]

  // 動画ダウンロード処理
  async function handleDownload(videoName: string) {
    // 既にダウンロード中の場合は無視
    if (downloadingVideos.has(videoName)) {
      return
    }

    try {
      // ダウンロード開始状態に設定
      setDownloadingVideos((prev) => new Set(prev).add(videoName))

      // Server Actionを呼び出してダウンロードURLを取得
      const result = await downloadVideo(videoName)

      if (!result.success) {
        alert(`エラー: ${result.error}`)
        return
      }

      if (result.downloadUrl) {
        // 新しいタブでダウンロードページを開く
        const link = document.createElement("a")
        link.href = result.downloadUrl
        link.download = videoName
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Download error:", error)
      alert("ダウンロードに失敗しました")
    } finally {
      // ダウンロード状態をリセット
      setDownloadingVideos((prev) => {
        const newSet = new Set(prev)
        newSet.delete(videoName)
        return newSet
      })
    }
  }

  return (
    <div className="w-full">
      {typeOrder.map((type) => {
        const videosOfType = groupedVideos[type]
        if (!videosOfType || videosOfType.length === 0) {
          return null
        }

        return (
          <div key={type} className="space-y-3">
            {/* 動画種別タイトル */}
            <div className="text-center">
              <h2 className="text-on-surface text-lg font-bold border-b border-on-surface pb-2">
                {type}
              </h2>
            </div>

            {/* 該当する動画一覧 */}
            <div className="space-y-2">
              {videosOfType.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between py-3 px-4"
                >
                  <div className="text-on-surface text-lg">
                    {video.video_name}
                  </div>
                  <Button
                    onClick={() => handleDownload(video.video_name)}
                    size="sm"
                    className="min-w-[60px]"
                    disabled={downloadingVideos.has(video.video_name)}
                  >
                    {downloadingVideos.has(video.video_name) ? "..." : "DL"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {videos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-on-surface/70 text-lg">
            このプレイヤーの動画はまだ登録されていません
          </p>
        </div>
      )}
    </div>
  )
}
