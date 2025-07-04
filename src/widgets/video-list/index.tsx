import { Button } from "../../shared/ui/button"

export function VideoList({ videos }: { videos: string[] }) {
  return (
    <div className="w-full">
      <div className="space-y-3">
        <div className="text-center">
          <h2 className="text-on-surface text-lg font-bold border-b border-on-surface pb-2">
            動画一覧
          </h2>
        </div>
        {videos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-on-surface text-lg">
              このプレイヤーの動画はまだ登録されていません
            </p>
          </div>
        )}
        {videos.map((video) => (
          <div
            key={video}
            className="flex items-center justify-between py-3 px-4"
          >
            <div className="text-on-surface text-lg">{video}</div>
            <Button
              href={`${process.env.CLOUDFLARE_WORKER_API}/${video}?action=get`}
              download={video}
              size="sm"
              className="min-w-[60px] text-center"
            >
              DL
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
