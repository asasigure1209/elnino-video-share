"use client"

import type { PlayerVideoWithDetails } from "../../entities/player-video/types"
import { Button } from "../../shared/ui/button"

interface VideoListProps {
  videos: PlayerVideoWithDetails[]
}

export function VideoList({ videos }: VideoListProps) {
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
                  >
                    DL
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

// ダウンロード処理（プレースホルダー）
function handleDownload(videoName: string) {
  // TODO: 実際のダウンロード処理を実装
  console.log(`Downloading video: ${videoName}`)
  alert(`${videoName} のダウンロードを開始します（未実装）`)
}
