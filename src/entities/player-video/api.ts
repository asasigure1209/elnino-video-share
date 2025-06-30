import { cache } from "react"
import {
  appendSheetData,
  getSheetData,
  updateSheetData,
} from "../../shared/api/google-sheets"
import { getPlayers } from "../player/api"
import { getVideos } from "../video/api"
import type {
  CreatePlayerVideoData,
  PlayerVideo,
  PlayerVideoWithDetails,
  UpdatePlayerVideoData,
} from "./types"

const SHEET_NAME = "player_videos"

// プレイヤー-動画マッピング一覧を取得（キャッシュ付き）
export const getPlayerVideos = cache(async (): Promise<PlayerVideo[]> => {
  try {
    const rows = await getSheetData(SHEET_NAME)

    // ヘッダー行をスキップして、データ行のみを処理
    const dataRows = rows.slice(1)

    return dataRows
      .map((row: unknown[]) => ({
        id: Number(row[0]) || 0,
        player_id: Number(row[1]) || 0,
        video_id: Number(row[2]) || 0,
      }))
      .filter(
        (playerVideo) =>
          playerVideo.id > 0 &&
          playerVideo.player_id > 0 &&
          playerVideo.video_id > 0,
      ) // 有効なデータのみ
  } catch (error) {
    console.error("Error fetching player videos:", error)
    throw new Error("プレイヤー-動画データの取得に失敗しました")
  }
})

// プレイヤーIDで動画一覧を取得
export const getVideosByPlayerId = cache(
  async (playerId: number): Promise<PlayerVideoWithDetails[]> => {
    try {
      const [playerVideos, players, videos] = await Promise.all([
        getPlayerVideos(),
        getPlayers(),
        getVideos(),
      ])

      // 指定されたプレイヤーのマッピングをフィルタ
      const playerVideoMappings = playerVideos.filter(
        (pv) => pv.player_id === playerId,
      )

      // プレイヤーと動画の詳細情報を結合
      const results: PlayerVideoWithDetails[] = []

      for (const mapping of playerVideoMappings) {
        const player = players.find((p) => p.id === mapping.player_id)
        const video = videos.find((v) => v.id === mapping.video_id)

        if (player && video) {
          results.push({
            ...mapping,
            player_name: player.name,
            video_name: video.name,
            video_type: video.type,
          })
        }
      }

      return results
    } catch (error) {
      console.error(`Error fetching videos for player ${playerId}:`, error)
      throw new Error("プレイヤーの動画データの取得に失敗しました")
    }
  },
)

// プレイヤー-動画マッピングを作成
export async function createPlayerVideo(
  data: CreatePlayerVideoData,
): Promise<PlayerVideo> {
  try {
    // 現在のマッピング一覧を取得して、新しいIDを生成
    const playerVideos = await getPlayerVideos()
    const newId =
      playerVideos.length > 0
        ? Math.max(...playerVideos.map((pv) => pv.id)) + 1
        : 1

    // スプレッドシートに新しい行を追加
    await appendSheetData(SHEET_NAME, [[newId, data.player_id, data.video_id]])

    return {
      id: newId,
      player_id: data.player_id,
      video_id: data.video_id,
    }
  } catch (error) {
    console.error("Error creating player video mapping:", error)
    throw new Error("プレイヤー-動画マッピングの作成に失敗しました")
  }
}

// プレイヤー-動画マッピングを更新
export async function updatePlayerVideo(
  data: UpdatePlayerVideoData,
): Promise<PlayerVideo> {
  try {
    // 現在のマッピング一覧を取得
    const playerVideos = await getPlayerVideos()
    const mappingIndex = playerVideos.findIndex((pv) => pv.id === data.id)

    if (mappingIndex === -1) {
      throw new Error("指定されたマッピングが見つかりません")
    }

    // スプレッドシートの該当行を更新（ヘッダー行があるので+2）
    const rowNumber = mappingIndex + 2
    await updateSheetData(SHEET_NAME, `A${rowNumber}:C${rowNumber}`, [
      [data.id, data.player_id, data.video_id],
    ])

    return {
      id: data.id,
      player_id: data.player_id,
      video_id: data.video_id,
    }
  } catch (error) {
    console.error("Error updating player video mapping:", error)
    // 特定のエラーメッセージの場合はそのまま再スロー
    if (
      error instanceof Error &&
      error.message === "指定されたマッピングが見つかりません"
    ) {
      throw error
    }
    throw new Error("プレイヤー-動画マッピングの更新に失敗しました")
  }
}

// プレイヤー-動画マッピングを削除
export async function deletePlayerVideo(id: number): Promise<void> {
  try {
    // 現在のマッピング一覧を取得
    const playerVideos = await getPlayerVideos()
    const mappingIndex = playerVideos.findIndex((pv) => pv.id === id)

    if (mappingIndex === -1) {
      throw new Error("指定されたマッピングが見つかりません")
    }

    // スプレッドシートの該当行のplayer_idを0にして無効化
    const rowNumber = mappingIndex + 2
    await updateSheetData(SHEET_NAME, `B${rowNumber}`, [[0]])
  } catch (error) {
    console.error("Error deleting player video mapping:", error)
    // 特定のエラーメッセージの場合はそのまま再スロー
    if (
      error instanceof Error &&
      error.message === "指定されたマッピングが見つかりません"
    ) {
      throw error
    }
    throw new Error("プレイヤー-動画マッピングの削除に失敗しました")
  }
}
