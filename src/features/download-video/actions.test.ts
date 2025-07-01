import { beforeEach, describe, expect, it, vi } from "vitest"

// vitest hoisted で定義したモック
const mockCheckVideoExists = vi.hoisted(() => vi.fn())
const mockGenerateDownloadUrl = vi.hoisted(() => vi.fn())

vi.mock("../../shared/api/cloudflare-r2", () => ({
  checkVideoExists: mockCheckVideoExists,
  generateDownloadUrl: mockGenerateDownloadUrl,
}))

import type { DownloadResult } from "./actions"
// モック対象のインポート
import { downloadVideo } from "./actions"

describe("downloadVideo", () => {
  beforeEach(() => {
    // Given: 各テスト前にモックをリセット
    vi.clearAllMocks()
  })

  describe("正常系", () => {
    it("有効なvideoNameでダウンロードURLが正常に生成される", async () => {
      // Given: 動画ファイルが存在し、ダウンロードURL生成が成功する
      const videoName = "test_video.mp4"
      const expectedDownloadUrl = "https://example.com/signed-url"
      mockCheckVideoExists.mockResolvedValue(true)
      mockGenerateDownloadUrl.mockResolvedValue(expectedDownloadUrl)

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: 成功レスポンスとダウンロードURLが返される
      const expected: DownloadResult = {
        success: true,
        downloadUrl: expectedDownloadUrl,
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).toHaveBeenCalledWith(videoName)
      expect(mockGenerateDownloadUrl).toHaveBeenCalledWith(videoName, 3600)
    })
  })

  describe("入力バリデーションエラー系", () => {
    it("videoNameが空文字列の場合、バリデーションエラーが返される", async () => {
      // Given: videoNameが空文字列
      const videoName = ""

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: バリデーションエラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "無効なファイル名です",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).not.toHaveBeenCalled()
      expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
    })

    it("videoNameがnullの場合、バリデーションエラーが返される", async () => {
      // Given: videoNameがnull
      const videoName = null as unknown as string

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: バリデーションエラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "無効なファイル名です",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).not.toHaveBeenCalled()
      expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
    })

    it("videoNameがundefinedの場合、バリデーションエラーが返される", async () => {
      // Given: videoNameがundefined
      const videoName = undefined as unknown as string

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: バリデーションエラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "無効なファイル名です",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).not.toHaveBeenCalled()
      expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
    })

    it("videoNameが数値の場合、バリデーションエラーが返される", async () => {
      // Given: videoNameが数値
      const videoName = 123 as unknown as string

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: バリデーションエラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "無効なファイル名です",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).not.toHaveBeenCalled()
      expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
    })

    it("videoNameがオブジェクトの場合、バリデーションエラーが返される", async () => {
      // Given: videoNameがオブジェクト
      const videoName = { name: "test.mp4" } as unknown as string

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: バリデーションエラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "無効なファイル名です",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).not.toHaveBeenCalled()
      expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
    })
  })

  describe("ビジネスロジックエラー系", () => {
    it("動画ファイルが存在しない場合、ファイル不存在エラーが返される", async () => {
      // Given: 動画ファイルが存在しない
      const videoName = "non_existent_video.mp4"
      mockCheckVideoExists.mockResolvedValue(false)

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: ファイル不存在エラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "動画ファイルが見つかりません",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).toHaveBeenCalledWith(videoName)
      expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
    })
  })

  describe("インフラストラクチャエラー系", () => {
    it("checkVideoExistsがエラーをthrowする場合、汎用エラーが返される", async () => {
      // Given: checkVideoExistsがエラーをthrow
      const videoName = "test_video.mp4"
      const error = new Error("R2 connection failed")
      mockCheckVideoExists.mockRejectedValue(error)

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: 汎用エラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "動画のダウンロード準備に失敗しました",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).toHaveBeenCalledWith(videoName)
      expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
    })

    it("generateDownloadUrlがエラーをthrowする場合、汎用エラーが返される", async () => {
      // Given: checkVideoExistsは成功するがgenerateDownloadUrlがエラーをthrow
      const videoName = "test_video.mp4"
      const error = new Error("URL generation failed")
      mockCheckVideoExists.mockResolvedValue(true)
      mockGenerateDownloadUrl.mockRejectedValue(error)

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: 汎用エラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "動画のダウンロード準備に失敗しました",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).toHaveBeenCalledWith(videoName)
      expect(mockGenerateDownloadUrl).toHaveBeenCalledWith(videoName, 3600)
    })
  })

  describe("エッジケース", () => {
    it("空白文字のみのvideoNameの場合、バリデーションを通過してcheckVideoExistsが呼ばれる", async () => {
      // Given: videoNameが空白文字のみ
      const videoName = "   "
      mockCheckVideoExists.mockResolvedValue(false)

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(videoName)

      // Then: バリデーションを通過し、ファイル不存在エラーが返される
      const expected: DownloadResult = {
        success: false,
        error: "動画ファイルが見つかりません",
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).toHaveBeenCalledWith(videoName)
      expect(mockGenerateDownloadUrl).not.toHaveBeenCalled()
    })

    it("非常に長いvideoNameでも正常に処理される", async () => {
      // Given: 非常に長いvideoName
      const longVideoName = `${"a".repeat(1000)}.mp4`
      const expectedDownloadUrl = "https://example.com/signed-url"
      mockCheckVideoExists.mockResolvedValue(true)
      mockGenerateDownloadUrl.mockResolvedValue(expectedDownloadUrl)

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(longVideoName)

      // Then: 正常に処理される
      const expected: DownloadResult = {
        success: true,
        downloadUrl: expectedDownloadUrl,
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).toHaveBeenCalledWith(longVideoName)
      expect(mockGenerateDownloadUrl).toHaveBeenCalledWith(longVideoName, 3600)
    })

    it("特殊文字を含むvideoNameでも正常に処理される", async () => {
      // Given: 特殊文字を含むvideoName
      const specialCharVideoName = "テスト動画_2024-01-01_#1.mp4"
      const expectedDownloadUrl = "https://example.com/signed-url"
      mockCheckVideoExists.mockResolvedValue(true)
      mockGenerateDownloadUrl.mockResolvedValue(expectedDownloadUrl)

      // When: 動画ダウンロードを実行する
      const result = await downloadVideo(specialCharVideoName)

      // Then: 正常に処理される
      const expected: DownloadResult = {
        success: true,
        downloadUrl: expectedDownloadUrl,
      }
      expect(result).toEqual(expected)
      expect(mockCheckVideoExists).toHaveBeenCalledWith(specialCharVideoName)
      expect(mockGenerateDownloadUrl).toHaveBeenCalledWith(
        specialCharVideoName,
        3600,
      )
    })
  })

  describe("コンソールログの確認", () => {
    it("エラー発生時にコンソールにエラーログが出力される", async () => {
      // Given: コンソールエラーをモック化し、checkVideoExistsがエラーをthrow
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const videoName = "test_video.mp4"
      const error = new Error("Test error")
      mockCheckVideoExists.mockRejectedValue(error)

      // When: 動画ダウンロードを実行する
      await downloadVideo(videoName)

      // Then: コンソールにエラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in downloadVideo action:",
        error,
      )

      // Cleanup
      consoleSpy.mockRestore()
    })
  })
})
