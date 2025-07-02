"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect, useId } from "react"
import { Button } from "../../../shared/ui/button"
import type { CreatePlayerState } from "../actions"
import { createPlayerAction } from "../actions"

const initialState: CreatePlayerState = {
  success: false,
}

export function CreatePlayerForm() {
  const nameId = useId()
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    createPlayerAction,
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
        プレイヤー新規作成
      </h2>

      <form action={formAction} className="space-y-6">
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
            {isPending ? "作成中..." : "新規作成"}
          </Button>
        </div>
      </form>
    </div>
  )
}
