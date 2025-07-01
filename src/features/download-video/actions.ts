"use server"

import {
  checkVideoExists,
  generateDownloadUrl,
} from "../../shared/api/cloudflare-r2"

export interface DownloadResult {
  success: boolean
  downloadUrl?: string
  error?: string
}

// 動画ダウンロード用のServer Action
export async function downloadVideo(
  videoName: string,
): Promise<DownloadResult> {
  try {
    // ファイル名のバリデーション
    if (!videoName || typeof videoName !== "string") {
      return {
        success: false,
        error: "無効なファイル名です",
      }
    }

    // ファイルの存在確認
    const exists = await checkVideoExists(videoName)
    if (!exists) {
      return {
        success: false,
        error: "動画ファイルが見つかりません",
      }
    }

    // 署名付きダウンロードURLを生成（1時間有効）
    const downloadUrl = await generateDownloadUrl(videoName, 3600)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    console.error("Error in downloadVideo action:", error)
    return {
      success: false,
      error: "動画のダウンロード準備に失敗しました",
    }
  }
}
