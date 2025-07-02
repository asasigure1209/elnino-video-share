"use server"

import { revalidatePath } from "next/cache"
import { deletePlayer } from "../../entities/player/api"

export interface DeletePlayerResult {
  success: boolean
  error?: string
}

// プレイヤー削除用のServer Action
export async function deletePlayerAction(
  playerId: number,
): Promise<DeletePlayerResult> {
  try {
    // プレイヤーIDのバリデーション
    if (!playerId || typeof playerId !== "number" || playerId <= 0) {
      return {
        success: false,
        error: "無効なプレイヤーIDです",
      }
    }

    // プレイヤーを削除
    await deletePlayer(playerId)

    // キャッシュを再検証してデータを最新化
    revalidatePath("/admin/players")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error in deletePlayerAction:", error)

    // 特定のエラーメッセージがある場合はそれを返す
    if (
      error instanceof Error &&
      error.message === "指定されたプレイヤーが見つかりません"
    ) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "プレイヤーの削除に失敗しました",
    }
  }
}
