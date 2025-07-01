import { cache } from "react"
import {
  appendSheetData,
  getSheetData,
  updateSheetData,
} from "../../shared/api/google-sheets"
import type { CreateVideoData, UpdateVideoData, Video } from "./types"

const SHEET_NAME = "videos"

// 動画一覧を取得（キャッシュ付き）
export const getVideos = cache(async (): Promise<Video[]> => {
  try {
    const rows = await getSheetData(SHEET_NAME)

    // ヘッダー行をスキップして、データ行のみを処理
    const dataRows = rows.slice(1)

    return dataRows
      .map((row: unknown[]) => ({
        id: Number(row[0]) || 0,
        name: String(row[1] || ""),
        type: String(row[2] || "") as Video["type"],
      }))
      .filter((video) => video.id > 0 && video.name && video.type) // 有効なデータのみ
  } catch (error) {
    console.error("Error fetching videos:", error)
    throw new Error("動画データの取得に失敗しました")
  }
})

// IDで動画を取得
export const getVideoById = cache(async (id: number): Promise<Video | null> => {
  try {
    const videos = await getVideos()
    return videos.find((video) => video.id === id) || null
  } catch (error) {
    console.error(`Error fetching video with id ${id}:`, error)
    throw new Error("動画データの取得に失敗しました")
  }
})

// 新しい動画を作成
export async function createVideo(data: CreateVideoData): Promise<Video> {
  try {
    // 現在の動画一覧を取得して、新しいIDを生成
    const videos = await getVideos()
    const newId =
      videos.length > 0 ? Math.max(...videos.map((v) => v.id)) + 1 : 1

    // スプレッドシートに新しい行を追加
    await appendSheetData(SHEET_NAME, [[newId, data.name, data.type]])

    return {
      id: newId,
      name: data.name,
      type: data.type,
    }
  } catch (error) {
    console.error("Error creating video:", error)
    throw new Error("動画の作成に失敗しました")
  }
}

// 動画情報を更新
export async function updateVideo(data: UpdateVideoData): Promise<Video> {
  try {
    // 現在の動画一覧を取得
    const videos = await getVideos()
    const videoIndex = videos.findIndex((v) => v.id === data.id)

    if (videoIndex === -1) {
      throw new Error("指定された動画が見つかりません")
    }

    // スプレッドシートの該当行を更新（ヘッダー行があるので+2）
    const rowNumber = videoIndex + 2
    await updateSheetData(SHEET_NAME, `A${rowNumber}:C${rowNumber}`, [
      [data.id, data.name, data.type],
    ])

    return {
      id: data.id,
      name: data.name,
      type: data.type,
    }
  } catch (error) {
    console.error("Error updating video:", error)
    // 特定のエラーメッセージの場合はそのまま再スロー
    if (
      error instanceof Error &&
      error.message === "指定された動画が見つかりません"
    ) {
      throw error
    }
    throw new Error("動画の更新に失敗しました")
  }
}

// 動画を削除（実際にはnameを空にして無効化）
export async function deleteVideo(id: number): Promise<void> {
  try {
    // 現在の動画一覧を取得
    const videos = await getVideos()
    const videoIndex = videos.findIndex((v) => v.id === id)

    if (videoIndex === -1) {
      throw new Error("指定された動画が見つかりません")
    }

    // スプレッドシートの該当行のnameを空にして無効化
    const rowNumber = videoIndex + 2
    await updateSheetData(SHEET_NAME, `B${rowNumber}`, [[""]])
  } catch (error) {
    console.error("Error deleting video:", error)
    // 特定のエラーメッセージの場合はそのまま再スロー
    if (
      error instanceof Error &&
      error.message === "指定された動画が見つかりません"
    ) {
      throw error
    }
    throw new Error("動画の削除に失敗しました")
  }
}
