import { unstable_cache } from "next/cache"
import { cache } from "react"
import { getSheetData } from "../../shared/api/google-sheets"
import type { Player } from "./types"

const SHEET_NAME = "players"

// プレイヤー一覧を取得（拡張キャッシュ付き）
const getPlayersUncached = async (): Promise<Player[]> => {
  try {
    const rows = await getSheetData(SHEET_NAME)

    // ヘッダー行をスキップして、データ行のみを処理
    const dataRows = rows.slice(1)

    // データをプレイヤー名でグループ化
    const playerGroups = new Map<string, string[]>()

    dataRows.forEach((row: unknown[]) => {
      const fileName = String(row[1] || "")
      const name = String(row[0] || "")

      if (fileName && name) {
        if (!playerGroups.has(name)) {
          playerGroups.set(name, [])
        }
        playerGroups.get(name)?.push(fileName)
      }
    })

    // グループ化されたデータをオブジェクトの配列に変換
    let id = 1
    return Array.from(playerGroups.entries()).map(([name, videos]) => ({
      id: id++,
      name,
      videos,
    }))
  } catch (error) {
    console.error("Error fetching players:", error)
    throw new Error("プレイヤーデータの取得に失敗しました")
  }
}

// 1時間キャッシュ + React cache の二重キャッシュ（テスト環境では従来のキャッシュのみ）
export const getPlayers =
  process.env.NODE_ENV === "test"
    ? cache(getPlayersUncached)
    : cache(
        unstable_cache(getPlayersUncached, ["players"], {
          revalidate: 3600,
          tags: ["players"],
        }),
      )
