"use server"

import { revalidatePath } from "next/cache"
import {
  createPlayer,
  deletePlayer,
  updatePlayer,
} from "../../entities/player/api"

export interface ActionResult {
  success: boolean
  error?: string
}

export interface CreatePlayerState extends ActionResult {
  player?: { id: number; name: string }
}

export interface UpdatePlayerState extends ActionResult {
  player?: { id: number; name: string }
}

// プレイヤー削除用のServer Action
export async function deletePlayerAction(
  playerId: number,
): Promise<ActionResult> {
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

// プレイヤー作成用のServer Action
export async function createPlayerAction(
  _prevState: CreatePlayerState | null,
  formData: FormData,
): Promise<CreatePlayerState> {
  try {
    // フォームデータの取得
    const name = formData.get("name") as string

    // バリデーション
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return {
        success: false,
        error: "プレイヤー名を入力してください",
      }
    }

    if (name.trim().length > 50) {
      return {
        success: false,
        error: "プレイヤー名は50文字以内で入力してください",
      }
    }

    // プレイヤーを作成
    await createPlayer({ name: name.trim() })

    // キャッシュを再検証してデータを最新化
    revalidatePath("/admin/players")

    // 成功時は success: true を返す
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error in createPlayerAction:", error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "プレイヤーの作成に失敗しました",
    }
  }
}

// プレイヤー更新用のServer Action
export async function updatePlayerAction(
  _prevState: UpdatePlayerState | null,
  formData: FormData,
): Promise<UpdatePlayerState> {
  try {
    // フォームデータの取得
    const id = Number(formData.get("id"))
    const name = formData.get("name") as string

    // バリデーション
    if (!id || typeof id !== "number" || id <= 0) {
      return {
        success: false,
        error: "無効なプレイヤーIDです",
      }
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return {
        success: false,
        error: "プレイヤー名を入力してください",
      }
    }

    if (name.trim().length > 50) {
      return {
        success: false,
        error: "プレイヤー名は50文字以内で入力してください",
      }
    }

    // プレイヤーを更新
    await updatePlayer({ id, name: name.trim() })

    // キャッシュを再検証してデータを最新化
    revalidatePath("/admin/players")
    revalidatePath(`/admin/players/${id}/edit`)

    // 成功時は success: true を返す
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error in updatePlayerAction:", error)

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
      error:
        error instanceof Error
          ? error.message
          : "プレイヤーの更新に失敗しました",
    }
  }
}
