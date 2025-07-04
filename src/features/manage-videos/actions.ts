"use server"

import { revalidatePath } from "next/cache"
import {
  createVideos,
  createVideoWithPlayers,
  deleteVideo,
  getVideoById,
  updateVideo,
  updateVideoPlayers,
} from "../../entities/video/api"
import type { VideoType } from "../../entities/video/types"
import {
  checkVideoExists,
  deleteVideo as deleteVideoFromR2,
  generatePresignedUploadUrl,
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

// 動画のアップロード用署名付きURL生成用のServer Action
export interface GenerateUploadUrlState extends ActionResult {
  uploadUrl?: string
  videoName?: string
}

export async function generateUploadUrlAction(
  _prevState: GenerateUploadUrlState | null,
  formData: FormData,
): Promise<GenerateUploadUrlState> {
  try {
    // フォームデータの取得
    const fileName = formData.get("fileName") as string
    const contentType = formData.get("contentType") as string
    const fileSize = Number(formData.get("fileSize"))

    // バリデーション
    if (
      !fileName ||
      typeof fileName !== "string" ||
      fileName.trim().length === 0
    ) {
      return {
        success: false,
        error: "ファイル名が指定されていません",
      }
    }

    if (!contentType || typeof contentType !== "string") {
      return {
        success: false,
        error: "コンテンツタイプが指定されていません",
      }
    }

    if (!fileSize || typeof fileSize !== "number" || fileSize <= 0) {
      return {
        success: false,
        error: "ファイルサイズが無効です",
      }
    }

    // ファイル名の検証
    const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv"]
    const fileExtension = fileName
      .toLowerCase()
      .slice(fileName.lastIndexOf("."))
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        success: false,
        error: "対応していないファイル形式です (.mp4, .mov, .avi, .mkv のみ)",
      }
    }

    // ファイルサイズの制限 (2GB) - 直接アップロードなので上限を上げる
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
    if (fileSize > maxSize) {
      return {
        success: false,
        error: "ファイルサイズが大きすぎます (最大2GB)",
      }
    }

    // 重複チェック - 既に同じファイル名が存在する場合はエラー
    const exists = await checkVideoExists(fileName)
    if (exists) {
      return {
        success: false,
        error: "同じファイル名の動画が既に存在します",
      }
    }

    // 署名付きURLを生成
    const uploadUrl = await generatePresignedUploadUrl(fileName, contentType)

    return {
      success: true,
      uploadUrl,
      videoName: fileName,
    }
  } catch (error) {
    console.error("Error in generateUploadUrlAction:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "アップロードURLの生成に失敗しました",
    }
  }
}

// 動画アップロード完了確認用のServer Action
export interface ConfirmUploadState extends ActionResult {
  video?: { id: number; name: string; type: string }
}

// 動画更新時のアップロード完了確認用のServer Action
export interface ConfirmUpdateUploadState extends ActionResult {
  video?: { id: number; name: string; type: string }
}

export async function confirmUploadAction(
  _prevState: ConfirmUploadState | null,
  formData: FormData,
): Promise<ConfirmUploadState> {
  try {
    // フォームデータの取得
    const videoName = formData.get("videoName") as string
    const type = formData.get("type") as string
    const playerIds = formData
      .getAll("playerIds")
      .map((id) => Number(id))
      .filter((id) => id > 0)

    // バリデーション
    if (
      !videoName ||
      typeof videoName !== "string" ||
      videoName.trim().length === 0
    ) {
      return {
        success: false,
        error: "動画名が指定されていません",
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

    // R2にファイルがアップロードされているかを確認
    const uploadExists = await checkVideoExists(videoName)
    if (!uploadExists) {
      return {
        success: false,
        error: "動画ファイルのアップロードが完了していません",
      }
    }

    // データベースに動画とプレイヤー紐付けを作成
    const video = await createVideoWithPlayers(
      {
        name: videoName,
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
    console.error("Error in confirmUploadAction:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "動画の登録に失敗しました",
    }
  }
}

// 動画更新時のアップロード完了確認用のServer Action
export async function confirmUpdateUploadAction(
  _prevState: ConfirmUpdateUploadState | null,
  formData: FormData,
): Promise<ConfirmUpdateUploadState> {
  try {
    // フォームデータの取得
    const id = Number(formData.get("id"))
    const videoName = formData.get("videoName") as string
    const type = formData.get("type") as string
    const playerIds = formData
      .getAll("playerIds")
      .map((id) => Number(id))
      .filter((id) => id > 0)
    const oldVideoName = formData.get("oldVideoName") as string

    // バリデーション
    if (!id || typeof id !== "number" || id <= 0) {
      return {
        success: false,
        error: "無効な動画IDです",
      }
    }

    if (
      !videoName ||
      typeof videoName !== "string" ||
      videoName.trim().length === 0
    ) {
      return {
        success: false,
        error: "動画名が指定されていません",
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

    // 新しいファイルがアップロードされた場合は、R2にファイルが存在することを確認
    if (videoName !== oldVideoName) {
      const uploadExists = await checkVideoExists(videoName)
      if (!uploadExists) {
        return {
          success: false,
          error: "新しい動画ファイルのアップロードが完了していません",
        }
      }

      // 古いファイルを削除
      try {
        await deleteVideoFromR2(oldVideoName)
      } catch (r2Error) {
        console.warn("古い動画ファイルの削除に失敗:", r2Error)
      }
    }

    // 動画情報を更新
    const updatedVideo = await updateVideo({
      id,
      name: videoName,
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
    console.error("Error in confirmUpdateUploadAction:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "動画の更新に失敗しました",
    }
  }
}

// 一括アップロード用の型定義
export interface BulkUploadItem {
  file: File
  fileName: string
  contentType: string
  fileSize: number
}

export interface BulkGenerateUrlsState extends ActionResult {
  uploadItems?: Array<{
    fileName: string
    uploadUrl: string
  }>
}

export interface BulkConfirmUploadsState extends ActionResult {
  videos?: Array<{ id: number; name: string; type: string }>
}

// 一括アップロード用署名付きURL生成
export async function bulkGenerateUploadUrlsAction(
  _prevState: BulkGenerateUrlsState | null,
  formData: FormData,
): Promise<BulkGenerateUrlsState> {
  try {
    // ファイル情報を取得
    const fileCount = Number(formData.get("fileCount"))
    const uploadItems: BulkUploadItem[] = []

    for (let i = 0; i < fileCount; i++) {
      const fileName = formData.get(`fileName_${i}`) as string
      const contentType = formData.get(`contentType_${i}`) as string
      const fileSize = Number(formData.get(`fileSize_${i}`))

      if (fileName && contentType && fileSize > 0) {
        uploadItems.push({
          fileName,
          contentType,
          fileSize,
        } as BulkUploadItem)
      }
    }

    if (uploadItems.length === 0) {
      return {
        success: false,
        error: "アップロードするファイルが選択されていません",
      }
    }

    // 各ファイルの検証
    const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv"]
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
    const errors: string[] = []

    for (const item of uploadItems) {
      const fileExtension = item.fileName
        .toLowerCase()
        .slice(item.fileName.lastIndexOf("."))

      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`${item.fileName}: 対応していないファイル形式です`)
      }

      if (item.fileSize > maxSize) {
        errors.push(`${item.fileName}: ファイルサイズが大きすぎます (最大2GB)`)
      }

      // 重複チェック
      const exists = await checkVideoExists(item.fileName)
      if (exists) {
        errors.push(`${item.fileName}: 同じファイル名の動画が既に存在します`)
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join("\n"),
      }
    }

    // 署名付きURLを生成
    const uploadUrls = await Promise.all(
      uploadItems.map(async (item) => ({
        fileName: item.fileName,
        uploadUrl: await generatePresignedUploadUrl(
          item.fileName,
          item.contentType,
        ),
      })),
    )

    return {
      success: true,
      uploadItems: uploadUrls,
    }
  } catch (error) {
    console.error("Error in bulkGenerateUploadUrlsAction:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "一括アップロードURLの生成に失敗しました",
    }
  }
}

// 一括アップロード完了確認
export async function bulkConfirmUploadsAction(
  _prevState: BulkConfirmUploadsState | null,
  formData: FormData,
): Promise<BulkConfirmUploadsState> {
  try {
    const type = formData.get("type") as string
    const fileNames = formData.getAll("videoNames") as string[]

    // バリデーション
    if (!type || typeof type !== "string" || type.trim().length === 0) {
      return {
        success: false,
        error: "動画タイプを選択してください",
      }
    }

    if (fileNames.length === 0) {
      return {
        success: false,
        error: "登録する動画が選択されていません",
      }
    }

    // 各動画ファイルがR2に存在することを確認
    const uploadChecks = await Promise.all(
      fileNames.map(async (fileName) => {
        const exists = await checkVideoExists(fileName)
        return { fileName, exists }
      }),
    )

    const missingFiles = uploadChecks
      .filter((check) => !check.exists)
      .map((check) => check.fileName)

    if (missingFiles.length > 0) {
      return {
        success: false,
        error: `以下のファイルのアップロードが完了していません:\n${missingFiles.join(", ")}`,
      }
    }

    // データベースに動画を一括登録（プレイヤー紐付けなし）
    const videoDataList = fileNames.map((fileName) => ({
      name: fileName,
      type: type as VideoType,
    }))

    const videos = await createVideos(videoDataList)

    // キャッシュを再検証
    revalidatePath("/admin/videos")

    return {
      success: true,
      videos: videos.map((video) => ({
        id: video.id,
        name: video.name,
        type: video.type,
      })),
    }
  } catch (error) {
    console.error("Error in bulkConfirmUploadsAction:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "一括動画登録に失敗しました",
    }
  }
}
