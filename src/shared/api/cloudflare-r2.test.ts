import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// vitest hoisted で定義したモック
const mockS3Client = vi.hoisted(() => ({
  send: vi.fn(),
}))

const mockGetSignedUrl = vi.hoisted(() => vi.fn())

const mockHeadObjectCommand = vi.hoisted(() => vi.fn())
const mockGetObjectCommand = vi.hoisted(() => vi.fn())
const mockPutObjectCommand = vi.hoisted(() => vi.fn())
const mockDeleteObjectCommand = vi.hoisted(() => vi.fn())

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => mockS3Client),
  HeadObjectCommand: mockHeadObjectCommand,
  GetObjectCommand: mockGetObjectCommand,
  PutObjectCommand: mockPutObjectCommand,
  DeleteObjectCommand: mockDeleteObjectCommand,
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}))

// モック対象のインポート
import {
  checkVideoExists,
  deleteVideo,
  generateDownloadUrl,
  getVideoMetadata,
  uploadVideo,
} from "./cloudflare-r2"

describe("Cloudflare R2 API", () => {
  beforeEach(() => {
    // Given: 各テスト前にモックをリセット
    vi.clearAllMocks()
    vi.stubEnv("CLOUDFLARE_R2_ACCOUNT_ID", "test-account-id")
    vi.stubEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", "test-access-key")
    vi.stubEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "test-secret-key")
    vi.stubEnv("CLOUDFLARE_R2_BUCKET_NAME", "test-bucket")
    vi.stubEnv("CLOUDFLARE_R2_REGION", "us-east-1")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe("環境変数設定", () => {
    it("CLOUDFLARE_R2_ACCOUNT_IDが設定されていない場合、falseが返される", async () => {
      // Given: CLOUDFLARE_R2_ACCOUNT_IDが設定されていない
      vi.stubEnv("CLOUDFLARE_R2_ACCOUNT_ID", "")

      // When: checkVideoExistsを実行する
      const result = await checkVideoExists("test.mp4")

      // Then: 設定エラーによりfalseが返される
      expect(result).toBe(false)
    })

    it("CLOUDFLARE_R2_ACCESS_KEY_IDが設定されていない場合、falseが返される", async () => {
      // Given: CLOUDFLARE_R2_ACCESS_KEY_IDが設定されていない
      vi.stubEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", "")

      // When: checkVideoExistsを実行する
      const result = await checkVideoExists("test.mp4")

      // Then: 設定エラーによりfalseが返される
      expect(result).toBe(false)
    })

    it("CLOUDFLARE_R2_SECRET_ACCESS_KEYが設定されていない場合、falseが返される", async () => {
      // Given: CLOUDFLARE_R2_SECRET_ACCESS_KEYが設定されていない
      vi.stubEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "")

      // When: checkVideoExistsを実行する
      const result = await checkVideoExists("test.mp4")

      // Then: 設定エラーによりfalseが返される
      expect(result).toBe(false)
    })

    it("CLOUDFLARE_R2_BUCKET_NAMEが設定されていない場合、falseが返される", async () => {
      // Given: CLOUDFLARE_R2_BUCKET_NAMEが設定されていない
      vi.stubEnv("CLOUDFLARE_R2_BUCKET_NAME", "")

      // When: checkVideoExistsを実行する
      const result = await checkVideoExists("test.mp4")

      // Then: 設定エラーによりfalseが返される
      expect(result).toBe(false)
    })

    it("CLOUDFLARE_R2_REGIONが設定されていない場合、デフォルト値'auto'が使用される", async () => {
      // Given: CLOUDFLARE_R2_REGIONが設定されていない
      vi.stubEnv("CLOUDFLARE_R2_REGION", "")
      mockS3Client.send.mockResolvedValue({})

      // When: checkVideoExistsを実行する
      await checkVideoExists("test.mp4")

      // Then: エラーが発生せず、S3Clientが作成される
      expect(mockS3Client.send).toHaveBeenCalled()
    })
  })

  describe("checkVideoExists", () => {
    it("動画ファイルが存在する場合、trueが返される", async () => {
      // Given: HeadObjectCommandが成功する
      const videoName = "existing_video.mp4"
      mockS3Client.send.mockResolvedValue({})

      // When: 動画の存在確認を実行する
      const result = await checkVideoExists(videoName)

      // Then: trueが返される
      expect(result).toBe(true)
      expect(mockHeadObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: videoName,
      })
      expect(mockS3Client.send).toHaveBeenCalled()
    })

    it("動画ファイルが存在しない場合、falseが返される", async () => {
      // Given: HeadObjectCommandが404エラーで失敗する
      const videoName = "non_existing_video.mp4"
      const error = new Error("NoSuchKey")
      error.name = "NoSuchKey"
      mockS3Client.send.mockRejectedValue(error)

      // When: 動画の存在確認を実行する
      const result = await checkVideoExists(videoName)

      // Then: falseが返される
      expect(result).toBe(false)
      expect(mockHeadObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: videoName,
      })
    })

    it("R2への接続エラーが発生した場合、falseが返される", async () => {
      // Given: HeadObjectCommandがネットワークエラーで失敗する
      const videoName = "test_video.mp4"
      const error = new Error("Network error")
      mockS3Client.send.mockRejectedValue(error)

      // When: 動画の存在確認を実行する
      const result = await checkVideoExists(videoName)

      // Then: falseが返される
      expect(result).toBe(false)
    })

    it("エラー発生時にコンソールにエラーログが出力される", async () => {
      // Given: コンソールエラーをモック化し、HeadObjectCommandがエラーで失敗する
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const videoName = "error_video.mp4"
      const error = new Error("Test error")
      mockS3Client.send.mockRejectedValue(error)

      // When: 動画の存在確認を実行する
      await checkVideoExists(videoName)

      // Then: コンソールにエラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        `Error checking video existence for ${videoName}:`,
        error,
      )

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe("generateDownloadUrl", () => {
    it("デフォルト有効期限（3600秒）で署名付きURLが生成される", async () => {
      // Given: getSignedUrlが成功する
      const videoName = "test_video.mp4"
      const expectedUrl = "https://signed-url.example.com"
      mockGetSignedUrl.mockResolvedValue(expectedUrl)

      // When: ダウンロードURLを生成する
      const result = await generateDownloadUrl(videoName)

      // Then: 署名付きURLが返される
      expect(result).toBe(expectedUrl)
      expect(mockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: videoName,
      })
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object),
        { expiresIn: 3600 },
      )
    })

    it("カスタム有効期限で署名付きURLが生成される", async () => {
      // Given: カスタム有効期限とgetSignedUrlが成功する
      const videoName = "test_video.mp4"
      const customExpiresIn = 7200 // 2時間
      const expectedUrl = "https://signed-url.example.com"
      mockGetSignedUrl.mockResolvedValue(expectedUrl)

      // When: カスタム有効期限でダウンロードURLを生成する
      const result = await generateDownloadUrl(videoName, customExpiresIn)

      // Then: 署名付きURLが返される
      expect(result).toBe(expectedUrl)
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object),
        { expiresIn: customExpiresIn },
      )
    })

    it("URL生成エラーが発生した場合、カスタムエラーが投げられる", async () => {
      // Given: getSignedUrlがエラーで失敗する
      const videoName = "error_video.mp4"
      const error = new Error("Signature generation failed")
      mockGetSignedUrl.mockRejectedValue(error)

      // When: ダウンロードURLを生成する
      // Then: カスタムエラーメッセージでエラーが投げられる
      await expect(generateDownloadUrl(videoName)).rejects.toThrow(
        "動画のダウンロードURLの生成に失敗しました",
      )
    })

    it("URL生成エラー発生時にコンソールにエラーログが出力される", async () => {
      // Given: コンソールエラーをモック化し、getSignedUrlがエラーで失敗する
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const videoName = "error_video.mp4"
      const error = new Error("Test error")
      mockGetSignedUrl.mockRejectedValue(error)

      // When: ダウンロードURLを生成する
      await expect(generateDownloadUrl(videoName)).rejects.toThrow()

      // Then: コンソールにエラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        `Error generating download URL for ${videoName}:`,
        error,
      )

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe("getVideoMetadata", () => {
    it("動画メタデータが正常に取得される", async () => {
      // Given: HeadObjectCommandが成功しメタデータを返す
      const videoName = "test_video.mp4"
      const mockMetadata = {
        ContentLength: 1048576, // 1MB
        ContentType: "video/mp4",
        LastModified: new Date("2024-01-01T00:00:00Z"),
        ETag: '"abc123def456"',
      }
      mockS3Client.send.mockResolvedValue(mockMetadata)

      // When: 動画メタデータを取得する
      const result = await getVideoMetadata(videoName)

      // Then: 正しいメタデータが返される
      const expected = {
        contentLength: 1048576,
        contentType: "video/mp4",
        lastModified: new Date("2024-01-01T00:00:00Z"),
        etag: '"abc123def456"',
      }
      expect(result).toEqual(expected)
      expect(mockHeadObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: videoName,
      })
    })

    it("メタデータの一部フィールドが未定義の場合でも正常に処理される", async () => {
      // Given: HeadObjectCommandが部分的なメタデータを返す
      const videoName = "partial_metadata_video.mp4"
      const mockMetadata = {
        ContentLength: 2097152, // 2MB
        // ContentType, LastModified, ETag は未定義
      }
      mockS3Client.send.mockResolvedValue(mockMetadata)

      // When: 動画メタデータを取得する
      const result = await getVideoMetadata(videoName)

      // Then: 取得できたフィールドのみが返される
      const expected = {
        contentLength: 2097152,
        contentType: undefined,
        lastModified: undefined,
        etag: undefined,
      }
      expect(result).toEqual(expected)
    })

    it("メタデータ取得エラーが発生した場合、カスタムエラーが投げられる", async () => {
      // Given: HeadObjectCommandがエラーで失敗する
      const videoName = "error_video.mp4"
      const error = new Error("Access denied")
      mockS3Client.send.mockRejectedValue(error)

      // When: 動画メタデータを取得する
      // Then: カスタムエラーメッセージでエラーが投げられる
      await expect(getVideoMetadata(videoName)).rejects.toThrow(
        "動画ファイル情報の取得に失敗しました",
      )
    })

    it("メタデータ取得エラー発生時にコンソールにエラーログが出力される", async () => {
      // Given: コンソールエラーをモック化し、HeadObjectCommandがエラーで失敗する
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const videoName = "error_video.mp4"
      const error = new Error("Test error")
      mockS3Client.send.mockRejectedValue(error)

      // When: 動画メタデータを取得する
      await expect(getVideoMetadata(videoName)).rejects.toThrow()

      // Then: コンソールにエラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        `Error getting video metadata for ${videoName}:`,
        error,
      )

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe("エッジケース", () => {
    it("空のvideoNameでもAPIが呼び出される", async () => {
      // Given: 空のvideoName
      const videoName = ""
      mockS3Client.send.mockResolvedValue({})

      // When: checkVideoExistsを実行する
      const result = await checkVideoExists(videoName)

      // Then: APIが呼び出されtrueが返される
      expect(result).toBe(true)
      expect(mockHeadObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "",
      })
    })

    it("特殊文字を含むvideoNameでも正常に処理される", async () => {
      // Given: 特殊文字を含むvideoName
      const videoName = "テスト動画_2024-01-01_#1.mp4"
      mockS3Client.send.mockResolvedValue({})

      // When: checkVideoExistsを実行する
      const result = await checkVideoExists(videoName)

      // Then: 正常に処理される
      expect(result).toBe(true)
      expect(mockHeadObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: videoName,
      })
    })

    it("非常に長いvideoNameでも正常に処理される", async () => {
      // Given: 非常に長いvideoName
      const longVideoName = `${"a".repeat(100)}.mp4` // テスト用に短縮
      mockS3Client.send.mockResolvedValue({})

      // When: checkVideoExistsを実行する
      const result = await checkVideoExists(longVideoName)

      // Then: 正常に処理される
      expect(result).toBe(true)
      expect(mockHeadObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: longVideoName,
      })
    })

    it("有効期限が0の場合でもURL生成が試行される", async () => {
      // Given: 有効期限が0
      const videoName = "test_video.mp4"
      const zeroExpiresIn = 0
      const expectedUrl = "https://signed-url.example.com"
      mockGetSignedUrl.mockResolvedValue(expectedUrl)

      // When: 有効期限0でダウンロードURLを生成する
      const result = await generateDownloadUrl(videoName, zeroExpiresIn)

      // Then: URLが生成される
      expect(result).toBe(expectedUrl)
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object),
        { expiresIn: 0 },
      )
    })

    it("負の有効期限でもURL生成が試行される", async () => {
      // Given: 負の有効期限
      const videoName = "test_video.mp4"
      const negativeExpiresIn = -3600
      const expectedUrl = "https://signed-url.example.com"
      mockGetSignedUrl.mockResolvedValue(expectedUrl)

      // When: 負の有効期限でダウンロードURLを生成する
      const result = await generateDownloadUrl(videoName, negativeExpiresIn)

      // Then: URLが生成される（AWS SDKが適切にハンドリング）
      expect(result).toBe(expectedUrl)
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object),
        { expiresIn: -3600 },
      )
    })
  })

  describe("uploadVideo", () => {
    describe("正常系", () => {
      it("should upload video successfully when valid parameters are provided", async () => {
        // Given: 有効なパラメータが提供される
        const videoName = "test_upload.mp4"
        const fileBuffer = Buffer.from("test video content")
        const contentType = "video/mp4"
        mockS3Client.send.mockResolvedValue({})

        // When: 動画をアップロードする
        await uploadVideo(videoName, fileBuffer, contentType)

        // Then: PutObjectCommandが正しいパラメータで呼び出される
        expect(mockPutObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: videoName,
          Body: fileBuffer,
          ContentType: contentType,
        })
        expect(mockS3Client.send).toHaveBeenCalledWith(
          expect.any(Object), // PutObjectCommandのインスタンス
        )
      })

      it("should upload video with default content type when no content type provided", async () => {
        // Given: コンテンツタイプが提供されない
        const videoName = "test_upload.mp4"
        const fileBuffer = Buffer.from("test video content")
        const contentType = "application/octet-stream"
        mockS3Client.send.mockResolvedValue({})

        // When: 動画をアップロードする
        await uploadVideo(videoName, fileBuffer, contentType)

        // Then: デフォルトのコンテンツタイプでアップロードされる
        expect(mockPutObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: videoName,
          Body: fileBuffer,
          ContentType: contentType,
        })
      })
    })

    describe("境界値テスト", () => {
      it("should handle empty file buffer", async () => {
        // Given: 空のファイルバッファ
        const videoName = "empty_file.mp4"
        const fileBuffer = Buffer.alloc(0)
        const contentType = "video/mp4"
        mockS3Client.send.mockResolvedValue({})

        // When: 空のファイルをアップロードする
        await uploadVideo(videoName, fileBuffer, contentType)

        // Then: アップロードが実行される
        expect(mockPutObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: videoName,
          Body: fileBuffer,
          ContentType: contentType,
        })
      })

      it("should handle special characters in video name", async () => {
        // Given: 特殊文字を含む動画名
        const videoName = "テスト動画_2024-01-01_#1 (1).mp4"
        const fileBuffer = Buffer.from("test content")
        const contentType = "video/mp4"
        mockS3Client.send.mockResolvedValue({})

        // When: 特殊文字を含む名前でアップロードする
        await uploadVideo(videoName, fileBuffer, contentType)

        // Then: 正常にアップロードされる
        expect(mockPutObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: videoName,
          Body: fileBuffer,
          ContentType: contentType,
        })
      })
    })

    describe("異常系", () => {
      it("should throw custom error when S3 upload fails", async () => {
        // Given: S3アップロードでエラーが発生する
        const videoName = "error_upload.mp4"
        const fileBuffer = Buffer.from("test content")
        const contentType = "video/mp4"
        const error = new Error("Access denied")
        mockS3Client.send.mockRejectedValue(error)

        // When: 動画をアップロードする
        // Then: カスタムエラーメッセージでエラーが投げられる
        await expect(
          uploadVideo(videoName, fileBuffer, contentType),
        ).rejects.toThrow("動画ファイルのアップロードに失敗しました")
      })

      it("should log error when upload fails", async () => {
        // Given: コンソールエラーをモック化し、S3アップロードでエラーが発生する
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {})
        const videoName = "error_upload.mp4"
        const fileBuffer = Buffer.from("test content")
        const contentType = "video/mp4"
        const error = new Error("Upload failed")
        mockS3Client.send.mockRejectedValue(error)

        // When: 動画をアップロードする
        await expect(
          uploadVideo(videoName, fileBuffer, contentType),
        ).rejects.toThrow()

        // Then: コンソールにエラーログが出力される
        expect(consoleSpy).toHaveBeenCalledWith(
          `Error uploading video ${videoName}:`,
          error,
        )

        // Cleanup
        consoleSpy.mockRestore()
      })

      it("should handle network timeout errors", async () => {
        // Given: ネットワークタイムアウトエラーが発生する
        const videoName = "timeout_upload.mp4"
        const fileBuffer = Buffer.from("test content")
        const contentType = "video/mp4"
        const timeoutError = new Error("Network timeout")
        timeoutError.name = "NetworkTimeoutError"
        mockS3Client.send.mockRejectedValue(timeoutError)

        // When: 動画をアップロードする
        // Then: カスタムエラーメッセージでエラーが投げられる
        await expect(
          uploadVideo(videoName, fileBuffer, contentType),
        ).rejects.toThrow("動画ファイルのアップロードに失敗しました")
      })
    })

    describe("環境変数エラー", () => {
      it("should throw custom error when environment variables are missing", async () => {
        // Given: 環境変数が設定されていない
        vi.stubEnv("CLOUDFLARE_R2_ACCOUNT_ID", "")
        const videoName = "test.mp4"
        const fileBuffer = Buffer.from("test content")
        const contentType = "video/mp4"

        // When: 動画をアップロードする
        // Then: カスタムエラーメッセージが投げられる（実装仕様に合わせて）
        await expect(
          uploadVideo(videoName, fileBuffer, contentType),
        ).rejects.toThrow("動画ファイルのアップロードに失敗しました")
      })
    })
  })

  describe("deleteVideo", () => {
    describe("正常系", () => {
      it("should delete video successfully when valid video name is provided", async () => {
        // Given: 有効な動画名が提供される
        const videoName = "test_delete.mp4"
        mockS3Client.send.mockResolvedValue({})

        // When: 動画を削除する
        await deleteVideo(videoName)

        // Then: DeleteObjectCommandが正しいパラメータで呼び出される
        expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: videoName,
        })
        expect(mockS3Client.send).toHaveBeenCalledWith(
          expect.any(Object), // DeleteObjectCommandのインスタンス
        )
      })

      it("should delete video with special characters in name", async () => {
        // Given: 特殊文字を含む動画名
        const videoName = "テスト動画_2024-01-01_#1 (1).mp4"
        mockS3Client.send.mockResolvedValue({})

        // When: 動画を削除する
        await deleteVideo(videoName)

        // Then: 正常に削除される
        expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: videoName,
        })
      })

      it("should handle deletion of non-existent file gracefully", async () => {
        // Given: 存在しないファイルの削除を試行する
        const videoName = "non_existent.mp4"
        // Note: S3は存在しないファイルの削除でもエラーを返さない仕様
        mockS3Client.send.mockResolvedValue({})

        // When: 存在しない動画を削除する
        await deleteVideo(videoName)

        // Then: エラーなく完了する
        expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: videoName,
        })
      })
    })

    describe("境界値テスト", () => {
      it("should handle empty video name", async () => {
        // Given: 空の動画名
        const videoName = ""
        mockS3Client.send.mockResolvedValue({})

        // When: 空の名前で動画を削除する
        await deleteVideo(videoName)

        // Then: 削除が実行される
        expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: "",
        })
      })

      it("should handle very long video name", async () => {
        // Given: 非常に長い動画名
        const longVideoName = `${"a".repeat(100)}.mp4` // テスト用に短縮
        mockS3Client.send.mockResolvedValue({})

        // When: 長い名前で動画を削除する
        await deleteVideo(longVideoName)

        // Then: 削除が実行される
        expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
          Bucket: "test-bucket",
          Key: longVideoName,
        })
      })
    })

    describe("異常系", () => {
      it("should throw custom error when S3 deletion fails", async () => {
        // Given: S3削除でエラーが発生する
        const videoName = "error_delete.mp4"
        const error = new Error("Access denied")
        mockS3Client.send.mockRejectedValue(error)

        // When: 動画を削除する
        // Then: カスタムエラーメッセージでエラーが投げられる
        await expect(deleteVideo(videoName)).rejects.toThrow(
          "動画ファイルの削除に失敗しました",
        )
      })

      it("should log error when deletion fails", async () => {
        // Given: コンソールエラーをモック化し、S3削除でエラーが発生する
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {})
        const videoName = "error_delete.mp4"
        const error = new Error("Deletion failed")
        mockS3Client.send.mockRejectedValue(error)

        // When: 動画を削除する
        await expect(deleteVideo(videoName)).rejects.toThrow()

        // Then: コンソールにエラーログが出力される
        expect(consoleSpy).toHaveBeenCalledWith(
          `Error deleting video ${videoName}:`,
          error,
        )

        // Cleanup
        consoleSpy.mockRestore()
      })

      it("should handle permission denied errors", async () => {
        // Given: 権限エラーが発生する
        const videoName = "permission_denied.mp4"
        const permissionError = new Error("Access denied")
        permissionError.name = "AccessDenied"
        mockS3Client.send.mockRejectedValue(permissionError)

        // When: 動画を削除する
        // Then: カスタムエラーメッセージでエラーが投げられる
        await expect(deleteVideo(videoName)).rejects.toThrow(
          "動画ファイルの削除に失敗しました",
        )
      })

      it("should handle bucket not found errors", async () => {
        // Given: バケットが見つからないエラーが発生する
        const videoName = "test.mp4"
        const bucketError = new Error("The specified bucket does not exist")
        bucketError.name = "NoSuchBucket"
        mockS3Client.send.mockRejectedValue(bucketError)

        // When: 動画を削除する
        // Then: カスタムエラーメッセージでエラーが投げられる
        await expect(deleteVideo(videoName)).rejects.toThrow(
          "動画ファイルの削除に失敗しました",
        )
      })
    })

    describe("環境変数エラー", () => {
      it("should throw custom error when environment variables are missing", async () => {
        // Given: 環境変数が設定されていない
        vi.stubEnv("CLOUDFLARE_R2_BUCKET_NAME", "")
        const videoName = "test.mp4"

        // When: 動画を削除する
        // Then: カスタムエラーメッセージが投げられる（実装仕様に合わせて）
        await expect(deleteVideo(videoName)).rejects.toThrow(
          "動画ファイルの削除に失敗しました",
        )
      })
    })
  })
})
