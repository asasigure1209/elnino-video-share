"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect, useId, useState } from "react"
import type { Player } from "../../../entities/player/types"
import type { VideoType } from "../../../entities/video/types"
import { Button } from "../../../shared/ui/button"
import type { CreateVideoState } from "../actions"
import { createVideoAction } from "../actions"

const initialState: CreateVideoState = {
  success: false,
}

const VIDEO_TYPES: VideoType[] = [
  "予選",
  "TOP16",
  "TOP8",
  "TOP4",
  "3位決定戦",
  "決勝戦",
]

interface CreateVideoFormProps {
  players: Player[]
}

export function CreateVideoForm({ players }: CreateVideoFormProps) {
  const fileId = useId()
  const typeId = useId()
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    createVideoAction,
    initialState,
  )
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // エラーがある場合はアラート表示、成功時はリダイレクト
  useEffect(() => {
    if (state.error) {
      alert(state.error)
    } else if (state.success) {
      // 成功時は動画一覧ページにリダイレクト
      router.push("/admin/videos")
    }
  }, [state.error, state.success, router])

  const handlePlayerToggle = (playerId: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSelectedFile(file || null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-on-primary mb-6 text-center">
        動画新規登録
      </h2>

      <form action={formAction} className="space-y-6">
        {/* ファイル選択 */}
        <div>
          <label
            htmlFor={fileId}
            className="block text-sm font-medium text-on-surface mb-2"
          >
            動画ファイル *
          </label>
          <input
            type="file"
            id={fileId}
            name="file"
            accept=".mp4,.mov,.avi,.mkv"
            required
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-hover"
            disabled={isPending}
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-on-surface/70">
              選択されたファイル: {selectedFile.name} (
              {Math.round(selectedFile.size / 1024 / 1024)}MB)
            </p>
          )}
          <p className="mt-1 text-xs text-on-surface/50">
            対応形式: .mp4, .mov, .avi, .mkv (最大500MB)
          </p>
        </div>

        {/* タイプ選択 */}
        <div>
          <label
            htmlFor={typeId}
            className="block text-sm font-medium text-on-surface mb-2"
          >
            タイプ *
          </label>
          <select
            id={typeId}
            name="type"
            required
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isPending}
          >
            <option value="">タイプを選択してください</option>
            {VIDEO_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* プレイヤー選択 */}
        <fieldset>
          <legend className="block text-sm font-medium text-on-surface mb-2">
            プレイヤー * (複数選択可)
          </legend>
          <div className="border border-outline rounded-md bg-surface p-3 max-h-64 overflow-y-auto">
            {players.length === 0 ? (
              <p className="text-on-surface/50 text-sm">
                プレイヤーが登録されていません
              </p>
            ) : (
              <div className="space-y-2">
                {players.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="playerIds"
                      value={player.id}
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => handlePlayerToggle(player.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-outline rounded"
                      disabled={isPending}
                    />
                    <span className="text-on-surface">{player.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedPlayers.length > 0 && (
            <p className="mt-2 text-sm text-on-surface/70">
              {selectedPlayers.length}人のプレイヤーが選択されています
            </p>
          )}
        </fieldset>

        {/* 送信ボタン */}
        <div className="text-center">
          <Button
            type="submit"
            size="lg"
            className="bg-on-primary hover:bg-primary-hover text-primary px-8 py-3 font-bold"
            disabled={
              isPending || !selectedFile || selectedPlayers.length === 0
            }
          >
            {isPending ? "登録中..." : "新規登録"}
          </Button>
        </div>
      </form>
    </div>
  )
}
