"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect, useId } from "react"
import type { Player } from "../../../entities/player/types"
import { Button } from "../../../shared/ui/button"
import type { UpdatePlayerState } from "../actions"
import { updatePlayerAction } from "../actions"

interface EditPlayerFormProps {
  player: Player
}

const initialState: UpdatePlayerState = {
  success: false,
}

export function EditPlayerForm({ player }: EditPlayerFormProps) {
  const entryNoId = useId()
  const nameId = useId()
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    updatePlayerAction,
    initialState,
  )

  // エラーがある場合はアラート表示、成功時はリダイレクト
  useEffect(() => {
    if (state.error) {
      alert(state.error)
    } else if (state.success) {
      // 成功時はプレイヤー一覧ページにリダイレクト
      router.push("/admin/players")
    }
  }, [state.error, state.success, router])

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold text-on-primary mb-6 text-center">
        プレイヤー編集
      </h2>

      <form action={formAction} className="space-y-6">
        {/* プレイヤーID（hidden） */}
        <input type="hidden" name="id" value={player.id} />

        {/* エントリーNo（読み取り専用） */}
        <div>
          <label
            htmlFor={entryNoId}
            className="block text-sm font-medium text-on-surface mb-2"
          >
            エントリーNo
          </label>
          <input
            type="text"
            id={entryNoId}
            value={player.id}
            readOnly
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface/50 text-on-surface/70 cursor-not-allowed"
          />
        </div>

        {/* プレイヤー名入力 */}
        <div>
          <label
            htmlFor={nameId}
            className="block text-sm font-medium text-on-surface mb-2"
          >
            プレイヤー名
          </label>
          <input
            type="text"
            id={nameId}
            name="name"
            defaultValue={player.name}
            required
            maxLength={50}
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="プレイヤー名を入力してください"
            disabled={isPending}
          />
        </div>

        {/* 送信ボタン */}
        <div className="text-center">
          <Button
            type="submit"
            size="lg"
            className="bg-on-primary hover:bg-primary-hover text-primary px-8 py-3 font-bold"
            disabled={isPending}
          >
            {isPending ? "更新中..." : "更新"}
          </Button>
        </div>
      </form>
    </div>
  )
}
