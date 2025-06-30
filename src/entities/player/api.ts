import { cache } from "react"
import {
  appendSheetData,
  getSheetData,
  updateSheetData,
} from "../../shared/api/google-sheets"
import type { CreatePlayerData, Player, UpdatePlayerData } from "./types"

const SHEET_NAME = "players"

// プレイヤー一覧を取得（キャッシュ付き）
export const getPlayers = cache(async (): Promise<Player[]> => {
  try {
    const rows = await getSheetData(SHEET_NAME)

    // ヘッダー行をスキップして、データ行のみを処理
    const dataRows = rows.slice(1)

    return dataRows
      .map((row: unknown[]) => ({
        id: Number(row[0]) || 0,
        name: String(row[1] || ""),
      }))
      .filter((player) => player.id > 0 && player.name) // 有効なデータのみ
  } catch (error) {
    console.error("Error fetching players:", error)
    throw new Error("プレイヤーデータの取得に失敗しました")
  }
})

// IDでプレイヤーを取得
export const getPlayerById = cache(
  async (id: number): Promise<Player | null> => {
    try {
      const players = await getPlayers()
      return players.find((player) => player.id === id) || null
    } catch (error) {
      console.error(`Error fetching player with id ${id}:`, error)
      throw new Error("プレイヤーデータの取得に失敗しました")
    }
  },
)

// 新しいプレイヤーを作成
export async function createPlayer(data: CreatePlayerData): Promise<Player> {
  try {
    // 現在のプレイヤー一覧を取得して、新しいIDを生成
    const players = await getPlayers()
    const newId =
      players.length > 0 ? Math.max(...players.map((p) => p.id)) + 1 : 1

    // スプレッドシートに新しい行を追加
    await appendSheetData(SHEET_NAME, [[newId, data.name]])

    return {
      id: newId,
      name: data.name,
    }
  } catch (error) {
    console.error("Error creating player:", error)
    throw new Error("プレイヤーの作成に失敗しました")
  }
}

// プレイヤー情報を更新
export async function updatePlayer(data: UpdatePlayerData): Promise<Player> {
  try {
    // 現在のプレイヤー一覧を取得
    const players = await getPlayers()
    const playerIndex = players.findIndex((p) => p.id === data.id)

    if (playerIndex === -1) {
      throw new Error("指定されたプレイヤーが見つかりません")
    }

    // スプレッドシートの該当行を更新（ヘッダー行があるので+2）
    const rowNumber = playerIndex + 2
    await updateSheetData(SHEET_NAME, `A${rowNumber}:B${rowNumber}`, [
      [data.id, data.name],
    ])

    return {
      id: data.id,
      name: data.name,
    }
  } catch (error) {
    console.error("Error updating player:", error)
    // 特定のエラーメッセージの場合はそのまま再スロー
    if (
      error instanceof Error &&
      error.message === "指定されたプレイヤーが見つかりません"
    ) {
      throw error
    }
    throw new Error("プレイヤーの更新に失敗しました")
  }
}

// プレイヤーを削除（実際にはnameを空にして無効化）
export async function deletePlayer(id: number): Promise<void> {
  try {
    // 現在のプレイヤー一覧を取得
    const players = await getPlayers()
    const playerIndex = players.findIndex((p) => p.id === id)

    if (playerIndex === -1) {
      throw new Error("指定されたプレイヤーが見つかりません")
    }

    // スプレッドシートの該当行のnameを空にして無効化
    const rowNumber = playerIndex + 2
    await updateSheetData(SHEET_NAME, `B${rowNumber}`, [[""]])
  } catch (error) {
    console.error("Error deleting player:", error)
    // 特定のエラーメッセージの場合はそのまま再スロー
    if (
      error instanceof Error &&
      error.message === "指定されたプレイヤーが見つかりません"
    ) {
      throw error
    }
    throw new Error("プレイヤーの削除に失敗しました")
  }
}
