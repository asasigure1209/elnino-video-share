"use server"

import { revalidatePath } from "next/cache"
import {
  createVideoWithPlayers,
  deleteVideo,
  getVideoById,
  updateVideo,
  updateVideoPlayers,
} from "../../entities/video/api"
import type { VideoType } from "../../entities/video/types"
import {
  deleteVideo as deleteVideoFromR2,
  uploadVideo,
} from "../../shared/api/cloudflare-r2"

export interface ActionResult {
  success: boolean
  error?: string
}

export interface CreateVideoState extends ActionResult {
  video?: { id: number; name: string; type: string }
}

export interface UpdateVideoState extends ActionResult {
  video?: { id: number; name: string; type: string }
}

// 動画削除用のServer Action
export async function deleteVideoAction(
  videoId: number,
): Promise<ActionResult> {
  try {
    // 動画IDのバリデーション
    if (!videoId || typeof videoId !== "number" || videoId <= 0) {
      return {
        success: false,
        error: "無効な動画IDです",
      }
    }

    // 動画情報を取得してファイル名を確認
    const video = await getVideoById(videoId)
    if (!video) {
      return {
        success: false,
        error: "指定された動画が見つかりません",
      }
    }

    // R2から動画ファイルを削除
    try {
      await deleteVideoFromR2(video.name)
    } catch (r2Error) {
      console.warn("R2からの動画削除に失敗しましたが、続行します:", r2Error)
      // R2からの削除に失敗してもデータベースからは削除する
    }

    // データベースから動画を削除
    await deleteVideo(videoId)

    // キャッシュを再検証してデータを最新化
    revalidatePath("/admin/videos")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error in deleteVideoAction:", error)

    // 特定のエラーメッセージがある場合はそれを返す
    if (
      error instanceof Error &&
      error.message === "指定された動画が見つかりません"
    ) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "動画の削除に失敗しました",
    }
  }
}

// 動画作成用のServer Action
export async function createVideoAction(
  _prevState: CreateVideoState | null,
  formData: FormData,
): Promise<CreateVideoState> {
  try {
    // フォームデータの取得
    const file = formData.get("file") as File
    const type = formData.get("type") as string
    const playerIds = formData
      .getAll("playerIds")
      .map((id) => Number(id))
      .filter((id) => id > 0)

    // バリデーション
    if (!file || !(file instanceof File) || file.size === 0) {
      return {
        success: false,
        error: "動画ファイルを選択してください",
      }
    }

    if (!type || typeof type !== "string" || type.trim().length === 0) {
      return {
        success: false,
        error: "動画タイプを選択してください",
      }
    }

    if (playerIds.length === 0) {
      return {
        success: false,
        error: "少なくとも1人のプレイヤーを選択してください",
      }
    }

    // ファイル名の検証
    const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv"]
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."))
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        success: false,
        error: "対応していないファイル形式です (.mp4, .mov, .avi, .mkv のみ)",
      }
    }

    // ファイルサイズの制限 (900MB)
    const maxSize = 900 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: "ファイルサイズが大きすぎます (最大900MB)",
      }
    }

    // ファイルをBufferに変換
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // R2に動画ファイルをアップロード
    await uploadVideo(file.name, fileBuffer, file.type || "video/mp4")

    // データベースに動画とプレイヤー紐付けを作成
    const video = await createVideoWithPlayers(
      {
        name: file.name,
        type: type as VideoType,
      },
      playerIds,
    )

    // キャッシュを再検証してデータを最新化
    revalidatePath("/admin/videos")

    return {
      success: true,
      video: {
        id: video.id,
        name: video.name,
        type: video.type,
      },
    }
  } catch (error) {
    console.error("Error in createVideoAction:", error)

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "動画の作成に失敗しました",
    }
  }
}

// 動画更新用のServer Action
export async function updateVideoAction(
  _prevState: UpdateVideoState | null,
  formData: FormData,
): Promise<UpdateVideoState> {
  try {
    // フォームデータの取得
    const id = Number(formData.get("id"))
    const type = formData.get("type") as string
    const file = formData.get("file") as File | null
    const playerIds = formData
      .getAll("playerIds")
      .map((id) => Number(id))
      .filter((id) => id > 0)

    // バリデーション
    if (!id || typeof id !== "number" || id <= 0) {
      return {
        success: false,
        error: "無効な動画IDです",
      }
    }

    if (!type || typeof type !== "string" || type.trim().length === 0) {
      return {
        success: false,
        error: "動画タイプを選択してください",
      }
    }

    if (playerIds.length === 0) {
      return {
        success: false,
        error: "少なくとも1人のプレイヤーを選択してください",
      }
    }

    // 既存の動画情報を取得
    const existingVideo = await getVideoById(id)
    if (!existingVideo) {
      return {
        success: false,
        error: "指定された動画が見つかりません",
      }
    }

    let fileName = existingVideo.name

    // 新しいファイルがアップロードされた場合
    if (file && file instanceof File && file.size > 0) {
      // ファイル名の検証
      const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv"]
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."))
      if (!allowedExtensions.includes(fileExtension)) {
        return {
          success: false,
          error: "対応していないファイル形式です (.mp4, .mov, .avi, .mkv のみ)",
        }
      }

      // ファイルサイズの制限 (500MB)
      const maxSize = 500 * 1024 * 1024
      if (file.size > maxSize) {
        return {
          success: false,
          error: "ファイルサイズが大きすぎます (最大500MB)",
        }
      }

      // 古いファイルを削除
      try {
        await deleteVideoFromR2(existingVideo.name)
      } catch (r2Error) {
        console.warn("古い動画ファイルの削除に失敗:", r2Error)
      }

      // ファイルをBufferに変換
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      // R2に新しい動画ファイルをアップロード
      await uploadVideo(file.name, fileBuffer, file.type || "video/mp4")

      fileName = file.name
    }

    // 動画情報を更新
    const updatedVideo = await updateVideo({
      id,
      name: fileName,
      type: type as VideoType,
    })

    // プレイヤー紐付けを更新
    await updateVideoPlayers(id, playerIds)

    // キャッシュを再検証してデータを最新化
    revalidatePath("/admin/videos")
    revalidatePath(`/admin/videos/${id}/edit`)

    return {
      success: true,
      video: {
        id: updatedVideo.id,
        name: updatedVideo.name,
        type: updatedVideo.type,
      },
    }
  } catch (error) {
    console.error("Error in updateVideoAction:", error)

    // 特定のエラーメッセージがある場合はそれを返す
    if (
      error instanceof Error &&
      error.message === "指定された動画が見つかりません"
    ) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "動画の更新に失敗しました",
    }
  }
}
