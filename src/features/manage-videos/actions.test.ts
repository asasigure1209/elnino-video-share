import { beforeEach, describe, expect, it, vi } from "vitest"

// vitest hoisted で定義したモック
const mockCreateVideoWithPlayers = vi.hoisted(() => vi.fn())
const mockCreateVideos = vi.hoisted(() => vi.fn())
const mockDeleteVideo = vi.hoisted(() => vi.fn())
const mockGetVideoById = vi.hoisted(() => vi.fn())
const mockUpdateVideo = vi.hoisted(() => vi.fn())
const mockUpdateVideoPlayers = vi.hoisted(() => vi.fn())
const mockDeleteVideoFromR2 = vi.hoisted(() => vi.fn())
const mockUploadVideo = vi.hoisted(() => vi.fn())
const mockCheckVideoExists = vi.hoisted(() => vi.fn())
const mockGeneratePresignedUploadUrl = vi.hoisted(() => vi.fn())
const mockRevalidatePath = vi.hoisted(() => vi.fn())

// entities/video/api のモック
vi.mock("../../entities/video/api", () => ({
  createVideoWithPlayers: mockCreateVideoWithPlayers,
  createVideos: mockCreateVideos,
  deleteVideo: mockDeleteVideo,
  getVideoById: mockGetVideoById,
  updateVideo: mockUpdateVideo,
  updateVideoPlayers: mockUpdateVideoPlayers,
}))

// shared/api/cloudflare-r2 のモック
vi.mock("../../shared/api/cloudflare-r2", () => ({
  checkVideoExists: mockCheckVideoExists,
  deleteVideo: mockDeleteVideoFromR2,
  generatePresignedUploadUrl: mockGeneratePresignedUploadUrl,
  uploadVideo: mockUploadVideo,
}))

// Next.js のモック
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}))

// モック対象のインポート
import type {
  ActionResult,
  CreateVideoState,
  UpdateVideoState,
} from "./actions"
import {
  createVideoAction,
  deleteVideoAction,
  updateVideoAction,
} from "./actions"

describe("manage-videos actions", () => {
  beforeEach(() => {
    // Given: 各テスト前にモックをリセット
    vi.clearAllMocks()
  })

  describe("deleteVideoAction", () => {
    describe("正常系", () => {
      it("should delete video successfully when valid videoId is provided", async () => {
        // Given: 有効なvideoIdと動画データが存在する
        const videoId = 1
        const mockVideo = { id: 1, name: "test.mp4", type: "予選" as const }
        mockGetVideoById.mockResolvedValue(mockVideo)
        mockDeleteVideoFromR2.mockResolvedValue(undefined)
        mockDeleteVideo.mockResolvedValue(undefined)

        // When: 動画削除を実行する
        const result = await deleteVideoAction(videoId)

        // Then: 成功レスポンスが返される
        const expected: ActionResult = {
          success: true,
        }
        expect(result).toEqual(expected)
        expect(mockGetVideoById).toHaveBeenCalledWith(videoId)
        expect(mockDeleteVideoFromR2).toHaveBeenCalledWith(mockVideo.name)
        expect(mockDeleteVideo).toHaveBeenCalledWith(videoId)
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/videos")
      })

      it("should continue deletion even when R2 file deletion fails", async () => {
        // Given: R2削除は失敗するが、動画データは存在する
        const videoId = 1
        const mockVideo = { id: 1, name: "test.mp4", type: "予選" as const }
        mockGetVideoById.mockResolvedValue(mockVideo)
        mockDeleteVideoFromR2.mockRejectedValue(new Error("R2 error"))
        mockDeleteVideo.mockResolvedValue(undefined)

        // When: 動画削除を実行する
        const result = await deleteVideoAction(videoId)

        // Then: 成功レスポンスが返される（R2エラーは警告のみ）
        expect(result.success).toBe(true)
        expect(mockDeleteVideo).toHaveBeenCalledWith(videoId)
      })
    })

    describe("バリデーションエラー系", () => {
      it.each([
        { videoId: 0, case: "0の場合" },
        { videoId: -1, case: "負の数の場合" },
        { videoId: null as unknown as number, case: "nullの場合" },
        { videoId: undefined as unknown as number, case: "undefinedの場合" },
        { videoId: "invalid" as unknown as number, case: "文字列の場合" },
      ])(
        "should return validation error when videoId is $case",
        async ({ videoId }) => {
          // When: 無効なvideoIdで動画削除を実行する
          const result = await deleteVideoAction(videoId)

          // Then: バリデーションエラーが返される
          expect(result).toEqual({
            success: false,
            error: "無効な動画IDです",
          })
          expect(mockGetVideoById).not.toHaveBeenCalled()
        },
      )
    })

    describe("ビジネスロジックエラー系", () => {
      it("should return error when video does not exist", async () => {
        // Given: 存在しない動画IDが指定される
        const videoId = 999
        mockGetVideoById.mockResolvedValue(null)

        // When: 動画削除を実行する
        const result = await deleteVideoAction(videoId)

        // Then: 動画が見つからないエラーが返される
        expect(result).toEqual({
          success: false,
          error: "指定された動画が見つかりません",
        })
        expect(mockDeleteVideoFromR2).not.toHaveBeenCalled()
        expect(mockDeleteVideo).not.toHaveBeenCalled()
      })

      it("should return specific error when video deletion throws 'video not found' error", async () => {
        // Given: 動画削除時に特定のエラーが発生する
        const videoId = 1
        const mockVideo = { id: 1, name: "test.mp4", type: "予選" as const }
        mockGetVideoById.mockResolvedValue(mockVideo)
        mockDeleteVideoFromR2.mockResolvedValue(undefined)
        mockDeleteVideo.mockRejectedValue(
          new Error("指定された動画が見つかりません"),
        )

        // When: 動画削除を実行する
        const result = await deleteVideoAction(videoId)

        // Then: 特定のエラーメッセージが返される
        expect(result).toEqual({
          success: false,
          error: "指定された動画が見つかりません",
        })
      })

      it("should return generic error when other database errors occur", async () => {
        // Given: データベースエラーが発生する
        const videoId = 1
        const mockVideo = { id: 1, name: "test.mp4", type: "予選" as const }
        mockGetVideoById.mockResolvedValue(mockVideo)
        mockDeleteVideoFromR2.mockResolvedValue(undefined)
        mockDeleteVideo.mockRejectedValue(
          new Error("Database connection failed"),
        )

        // When: 動画削除を実行する
        const result = await deleteVideoAction(videoId)

        // Then: 汎用エラーメッセージが返される
        expect(result).toEqual({
          success: false,
          error: "動画の削除に失敗しました",
        })
      })
    })
  })

  describe("createVideoAction", () => {
    const createMockFormData = (
      data: Record<string, string | File | string[]>,
    ) => {
      const formData = new FormData()
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            formData.append(key, item)
          }
        } else {
          formData.append(key, value)
        }
      }
      return formData
    }

    const createMockFile = (
      name: string,
      size: number = 1024 * 1024,
      type: string = "video/mp4",
    ) => {
      const file = new File([""], name, { type })
      Object.defineProperty(file, "size", { value: size })
      // テスト環境でarrayBuffer()メソッドを追加
      Object.defineProperty(file, "arrayBuffer", {
        value: vi.fn().mockResolvedValue(new ArrayBuffer(size)),
        writable: true,
      })
      return file
    }

    describe("正常系", () => {
      it("should create video successfully with valid data", async () => {
        // Given: 有効な動画データが提供される
        const mockFile = createMockFile("test.mp4")
        const formData = createMockFormData({
          file: mockFile,
          type: "予選",
          playerIds: ["1", "2"],
        })
        const mockCreatedVideo = {
          id: 1,
          name: "test.mp4",
          type: "予選" as const,
        }
        mockUploadVideo.mockResolvedValue(undefined)
        mockCreateVideoWithPlayers.mockResolvedValue(mockCreatedVideo)

        // When: 動画作成を実行する
        const result = await createVideoAction(null, formData)

        // Then: 成功レスポンスが返される
        const expected: CreateVideoState = {
          success: true,
          video: {
            id: 1,
            name: "test.mp4",
            type: "予選",
          },
        }
        expect(result).toEqual(expected)
        expect(mockUploadVideo).toHaveBeenCalledWith(
          "test.mp4",
          expect.any(Buffer),
          "video/mp4",
        )
        expect(mockCreateVideoWithPlayers).toHaveBeenCalledWith(
          { name: "test.mp4", type: "予選" },
          [1, 2],
        )
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/videos")
      })
    })

    describe("バリデーションエラー系", () => {
      it("should return error when no file is provided", async () => {
        // Given: ファイルが提供されない
        const formData = createMockFormData({
          type: "予選",
          playerIds: ["1"],
        })

        // When: 動画作成を実行する
        const result = await createVideoAction(null, formData)

        // Then: ファイル必須エラーが返される
        expect(result).toEqual({
          success: false,
          error: "動画ファイルを選択してください",
        })
        expect(mockUploadVideo).not.toHaveBeenCalled()
      })

      it("should return error when empty file is provided", async () => {
        // Given: 空のファイルが提供される
        const mockFile = createMockFile("test.mp4", 0)
        const formData = createMockFormData({
          file: mockFile,
          type: "予選",
          playerIds: ["1"],
        })

        // When: 動画作成を実行する
        const result = await createVideoAction(null, formData)

        // Then: ファイル必須エラーが返される
        expect(result).toEqual({
          success: false,
          error: "動画ファイルを選択してください",
        })
      })

      it("should return error when no type is provided", async () => {
        // Given: タイプが提供されない
        const mockFile = createMockFile("test.mp4")
        const formData = createMockFormData({
          file: mockFile,
          playerIds: ["1"],
        })

        // When: 動画作成を実行する
        const result = await createVideoAction(null, formData)

        // Then: タイプ必須エラーが返される
        expect(result).toEqual({
          success: false,
          error: "動画タイプを選択してください",
        })
      })

      it("should return error when no players are selected", async () => {
        // Given: プレイヤーが選択されない
        const mockFile = createMockFile("test.mp4")
        const formData = createMockFormData({
          file: mockFile,
          type: "予選",
        })

        // When: 動画作成を実行する
        const result = await createVideoAction(null, formData)

        // Then: プレイヤー選択必須エラーが返される
        expect(result).toEqual({
          success: false,
          error: "少なくとも1人のプレイヤーを選択してください",
        })
      })

      it.each([
        { extension: ".txt", case: "テキストファイル" },
        { extension: ".jpg", case: "画像ファイル" },
        { extension: ".pdf", case: "PDFファイル" },
        { extension: "", case: "拡張子なし" },
      ])(
        "should return error when unsupported file format is provided ($case)",
        async ({ extension }) => {
          // Given: 対応していないファイル形式が提供される
          const mockFile = createMockFile(`test${extension}`)
          const formData = createMockFormData({
            file: mockFile,
            type: "予選",
            playerIds: ["1"],
          })

          // When: 動画作成を実行する
          const result = await createVideoAction(null, formData)

          // Then: ファイル形式エラーが返される
          expect(result).toEqual({
            success: false,
            error:
              "対応していないファイル形式です (.mp4, .mov, .avi, .mkv のみ)",
          })
        },
      )

      it("should return error when file size exceeds limit", async () => {
        // Given: ファイルサイズが制限を超過している
        const mockFile = createMockFile("test.mp4", 1000 * 1024 * 1024) // 1GB
        const formData = createMockFormData({
          file: mockFile,
          type: "予選",
          playerIds: ["1"],
        })

        // When: 動画作成を実行する
        const result = await createVideoAction(null, formData)

        // Then: ファイルサイズエラーが返される
        expect(result).toEqual({
          success: false,
          error: "ファイルサイズが大きすぎます (最大900MB)",
        })
      })
    })

    describe("インフラストラクチャエラー系", () => {
      it("should return error when R2 upload fails", async () => {
        // Given: R2アップロードでエラーが発生する
        const mockFile = createMockFile("test.mp4")
        const formData = createMockFormData({
          file: mockFile,
          type: "予選",
          playerIds: ["1"],
        })
        mockUploadVideo.mockRejectedValue(new Error("R2 upload failed"))

        // When: 動画作成を実行する
        const result = await createVideoAction(null, formData)

        // Then: エラーメッセージが返される
        expect(result).toEqual({
          success: false,
          error: "R2 upload failed",
        })
        expect(mockCreateVideoWithPlayers).not.toHaveBeenCalled()
      })

      it("should return error when database creation fails", async () => {
        // Given: データベース作成でエラーが発生する
        const mockFile = createMockFile("test.mp4")
        const formData = createMockFormData({
          file: mockFile,
          type: "予選",
          playerIds: ["1"],
        })
        mockUploadVideo.mockResolvedValue(undefined)
        mockCreateVideoWithPlayers.mockRejectedValue(
          new Error("Database creation failed"),
        )

        // When: 動画作成を実行する
        const result = await createVideoAction(null, formData)

        // Then: エラーメッセージが返される
        expect(result).toEqual({
          success: false,
          error: "Database creation failed",
        })
      })
    })
  })

  describe("updateVideoAction", () => {
    const createMockFormData = (
      data: Record<string, string | File | string[]>,
    ) => {
      const formData = new FormData()
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            formData.append(key, item)
          }
        } else {
          formData.append(key, value)
        }
      }
      return formData
    }

    const createMockFile = (
      name: string,
      size: number = 1024 * 1024,
      type: string = "video/mp4",
    ) => {
      const file = new File([""], name, { type })
      Object.defineProperty(file, "size", { value: size })
      // テスト環境でarrayBuffer()メソッドを追加
      Object.defineProperty(file, "arrayBuffer", {
        value: vi.fn().mockResolvedValue(new ArrayBuffer(size)),
        writable: true,
      })
      return file
    }

    describe("正常系", () => {
      it("should update video metadata without file replacement", async () => {
        // Given: ファイル差し替えなしでメタデータのみ更新
        const formData = createMockFormData({
          id: "1",
          type: "TOP16",
          playerIds: ["2", "3"],
        })
        const mockExistingVideo = {
          id: 1,
          name: "existing.mp4",
          type: "予選" as const,
        }
        const mockUpdatedVideo = {
          id: 1,
          name: "existing.mp4",
          type: "TOP16" as const,
        }
        mockGetVideoById.mockResolvedValue(mockExistingVideo)
        mockUpdateVideo.mockResolvedValue(mockUpdatedVideo)
        mockUpdateVideoPlayers.mockResolvedValue(undefined)

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: 成功レスポンスが返される
        const expected: UpdateVideoState = {
          success: true,
          video: {
            id: 1,
            name: "existing.mp4",
            type: "TOP16",
          },
        }
        expect(result).toEqual(expected)
        expect(mockUpdateVideo).toHaveBeenCalledWith({
          id: 1,
          name: "existing.mp4",
          type: "TOP16",
        })
        expect(mockUpdateVideoPlayers).toHaveBeenCalledWith(1, [2, 3])
        expect(mockDeleteVideoFromR2).not.toHaveBeenCalled()
        expect(mockUploadVideo).not.toHaveBeenCalled()
      })

      it("should update video with file replacement", async () => {
        // Given: ファイル差し替えありで動画更新
        const newFile = createMockFile("new.mp4")
        const formData = createMockFormData({
          id: "1",
          type: "TOP16",
          file: newFile,
          playerIds: ["2"],
        })
        const mockExistingVideo = {
          id: 1,
          name: "old.mp4",
          type: "予選" as const,
        }
        const mockUpdatedVideo = {
          id: 1,
          name: "new.mp4",
          type: "TOP16" as const,
        }
        mockGetVideoById.mockResolvedValue(mockExistingVideo)
        mockDeleteVideoFromR2.mockResolvedValue(undefined)
        mockUploadVideo.mockResolvedValue(undefined)
        mockUpdateVideo.mockResolvedValue(mockUpdatedVideo)
        mockUpdateVideoPlayers.mockResolvedValue(undefined)

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: 成功レスポンスが返される
        expect(result.success).toBe(true)
        expect(mockDeleteVideoFromR2).toHaveBeenCalledWith("old.mp4")
        expect(mockUploadVideo).toHaveBeenCalledWith(
          "new.mp4",
          expect.any(Buffer),
          "video/mp4",
        )
        expect(mockUpdateVideo).toHaveBeenCalledWith({
          id: 1,
          name: "new.mp4",
          type: "TOP16",
        })
      })
    })

    describe("バリデーションエラー系", () => {
      it.each([
        { id: "0", case: "0の場合" },
        { id: "-1", case: "負の数の場合" },
        { id: "", case: "空文字の場合" },
        { id: "invalid", case: "数値以外の場合" },
      ])(
        "should return error when invalid id is provided ($case)",
        async ({ id }) => {
          // Given: 無効なIDが提供される
          const formData = createMockFormData({
            id,
            type: "予選",
            playerIds: ["1"],
          })

          // When: 動画更新を実行する
          const result = await updateVideoAction(null, formData)

          // Then: バリデーションエラーが返される
          expect(result).toEqual({
            success: false,
            error: "無効な動画IDです",
          })
          expect(mockGetVideoById).not.toHaveBeenCalled()
        },
      )

      it("should return error when no type is provided", async () => {
        // Given: タイプが提供されない
        const formData = createMockFormData({
          id: "1",
          playerIds: ["1"],
        })

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: タイプ必須エラーが返される
        expect(result).toEqual({
          success: false,
          error: "動画タイプを選択してください",
        })
      })

      it("should return error when no players are selected", async () => {
        // Given: プレイヤーが選択されない
        const formData = createMockFormData({
          id: "1",
          type: "予選",
        })

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: プレイヤー選択必須エラーが返される
        expect(result).toEqual({
          success: false,
          error: "少なくとも1人のプレイヤーを選択してください",
        })
      })

      it("should return error when unsupported file format is provided for replacement", async () => {
        // Given: 対応していないファイル形式で差し替えが試行される
        const invalidFile = createMockFile("test.txt")
        const formData = createMockFormData({
          id: "1",
          type: "予選",
          file: invalidFile,
          playerIds: ["1"],
        })
        mockGetVideoById.mockResolvedValue({
          id: 1,
          name: "old.mp4",
          type: "予選" as const,
        })

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: ファイル形式エラーが返される
        expect(result).toEqual({
          success: false,
          error: "対応していないファイル形式です (.mp4, .mov, .avi, .mkv のみ)",
        })
      })

      it("should return error when file size exceeds limit for replacement", async () => {
        // Given: ファイルサイズが制限を超過している
        const largeFile = createMockFile("test.mp4", 600 * 1024 * 1024)
        const formData = createMockFormData({
          id: "1",
          type: "予選",
          file: largeFile,
          playerIds: ["1"],
        })
        mockGetVideoById.mockResolvedValue({
          id: 1,
          name: "old.mp4",
          type: "予選" as const,
        })

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: ファイルサイズエラーが返される
        expect(result).toEqual({
          success: false,
          error: "ファイルサイズが大きすぎます (最大500MB)",
        })
      })
    })

    describe("ビジネスロジックエラー系", () => {
      it("should return error when video does not exist", async () => {
        // Given: 存在しない動画IDが指定される
        const formData = createMockFormData({
          id: "999",
          type: "予選",
          playerIds: ["1"],
        })
        mockGetVideoById.mockResolvedValue(null)

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: 動画が見つからないエラーが返される
        expect(result).toEqual({
          success: false,
          error: "指定された動画が見つかりません",
        })
        expect(mockUpdateVideo).not.toHaveBeenCalled()
      })

      it("should return specific error when video update throws 'video not found' error", async () => {
        // Given: 動画更新時に特定のエラーが発生する
        const formData = createMockFormData({
          id: "1",
          type: "予選",
          playerIds: ["1"],
        })
        mockGetVideoById.mockResolvedValue({
          id: 1,
          name: "test.mp4",
          type: "予選" as const,
        })
        mockUpdateVideo.mockRejectedValue(
          new Error("指定された動画が見つかりません"),
        )

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: 特定のエラーメッセージが返される
        expect(result).toEqual({
          success: false,
          error: "指定された動画が見つかりません",
        })
      })

      it("should return generic error when other database errors occur", async () => {
        // Given: データベースエラーが発生する
        const formData = createMockFormData({
          id: "1",
          type: "予選",
          playerIds: ["1"],
        })
        mockGetVideoById.mockResolvedValue({
          id: 1,
          name: "test.mp4",
          type: "予選" as const,
        })
        mockUpdateVideo.mockRejectedValue(
          new Error("Database connection failed"),
        )

        // When: 動画更新を実行する
        const result = await updateVideoAction(null, formData)

        // Then: 汎用エラーメッセージが返される
        expect(result).toEqual({
          success: false,
          error: "Database connection failed",
        })
      })
    })
  })

  describe("bulkConfirmUploadsAction", () => {
    it("複数動画の一括登録が正常に動作する", async () => {
      // Given: フォームデータを準備
      const formData = new FormData()
      formData.append("type", "予選")
      formData.append("videoNames", "video1.mp4")
      formData.append("videoNames", "video2.mp4")
      formData.append("videoNames", "video3.mp4")

      // R2ファイル存在チェックのモック
      mockCheckVideoExists.mockResolvedValue(true)

      // createVideos のモック
      mockCreateVideos.mockResolvedValue([
        { id: 1, name: "video1.mp4", type: "予選" },
        { id: 2, name: "video2.mp4", type: "予選" },
        { id: 3, name: "video3.mp4", type: "予選" },
      ])

      // Dynamic import のモック
      const { bulkConfirmUploadsAction } = await import("./actions")

      // When: 一括確認アクションを実行
      const result = await bulkConfirmUploadsAction(null, formData)

      // Then: 正常に動画が作成される
      expect(mockCheckVideoExists).toHaveBeenCalledTimes(3)
      expect(mockCheckVideoExists).toHaveBeenCalledWith("video1.mp4")
      expect(mockCheckVideoExists).toHaveBeenCalledWith("video2.mp4")
      expect(mockCheckVideoExists).toHaveBeenCalledWith("video3.mp4")

      expect(mockCreateVideos).toHaveBeenCalledWith([
        { name: "video1.mp4", type: "予選" },
        { name: "video2.mp4", type: "予選" },
        { name: "video3.mp4", type: "予選" },
      ])

      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/videos")

      expect(result).toEqual({
        success: true,
        videos: [
          { id: 1, name: "video1.mp4", type: "予選" },
          { id: 2, name: "video2.mp4", type: "予選" },
          { id: 3, name: "video3.mp4", type: "予選" },
        ],
      })
    })

    it("アップロードが未完了のファイルがある場合エラーを返す", async () => {
      // Given: フォームデータを準備
      const formData = new FormData()
      formData.append("type", "TOP16")
      formData.append("videoNames", "video1.mp4")
      formData.append("videoNames", "video2.mp4")

      // 一つのファイルが存在しない
      mockCheckVideoExists
        .mockResolvedValueOnce(true) // video1.mp4
        .mockResolvedValueOnce(false) // video2.mp4

      // Dynamic import のモック
      const { bulkConfirmUploadsAction } = await import("./actions")

      // When: 一括確認アクションを実行
      const result = await bulkConfirmUploadsAction(null, formData)

      // Then: エラーが返される
      expect(result).toEqual({
        success: false,
        error: "以下のファイルのアップロードが完了していません:\nvideo2.mp4",
      })

      expect(mockCreateVideos).not.toHaveBeenCalled()
    })

    it("動画タイプが未選択の場合エラーを返す", async () => {
      // Given: タイプが空のフォームデータ
      const formData = new FormData()
      formData.append("type", "")
      formData.append("videoNames", "video1.mp4")

      // Dynamic import のモック
      const { bulkConfirmUploadsAction } = await import("./actions")

      // When: 一括確認アクションを実行
      const result = await bulkConfirmUploadsAction(null, formData)

      // Then: エラーが返される
      expect(result).toEqual({
        success: false,
        error: "動画タイプを選択してください",
      })

      expect(mockCheckVideoExists).not.toHaveBeenCalled()
      expect(mockCreateVideos).not.toHaveBeenCalled()
    })

    it("登録する動画が選択されていない場合エラーを返す", async () => {
      // Given: 動画名が空のフォームデータ
      const formData = new FormData()
      formData.append("type", "TOP8")

      // Dynamic import のモック
      const { bulkConfirmUploadsAction } = await import("./actions")

      // When: 一括確認アクションを実行
      const result = await bulkConfirmUploadsAction(null, formData)

      // Then: エラーが返される
      expect(result).toEqual({
        success: false,
        error: "登録する動画が選択されていません",
      })

      expect(mockCheckVideoExists).not.toHaveBeenCalled()
      expect(mockCreateVideos).not.toHaveBeenCalled()
    })

    it("createVideosでエラーが発生した場合適切にハンドリングする", async () => {
      // Given: フォームデータを準備
      const formData = new FormData()
      formData.append("type", "決勝戦")
      formData.append("videoNames", "final.mp4")

      // R2ファイル存在チェックのモック
      mockCheckVideoExists.mockResolvedValue(true)

      // createVideos がエラーを投げる
      mockCreateVideos.mockRejectedValue(new Error("Database error"))

      // Dynamic import のモック
      const { bulkConfirmUploadsAction } = await import("./actions")

      // When: 一括確認アクションを実行
      const result = await bulkConfirmUploadsAction(null, formData)

      // Then: エラーが返される
      expect(result).toEqual({
        success: false,
        error: "Database error",
      })
    })
  })
})
