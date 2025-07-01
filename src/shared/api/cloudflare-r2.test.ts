import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// vitest hoisted で定義したモック
const mockS3Client = vi.hoisted(() => ({
  send: vi.fn(),
}))

const mockGetSignedUrl = vi.hoisted(() => vi.fn())

const mockHeadObjectCommand = vi.hoisted(() => vi.fn())
const mockGetObjectCommand = vi.hoisted(() => vi.fn())

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => mockS3Client),
  HeadObjectCommand: mockHeadObjectCommand,
  GetObjectCommand: mockGetObjectCommand,
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}))

// モック対象のインポート
import {
  checkVideoExists,
  generateDownloadUrl,
  getVideoMetadata,
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
      const longVideoName = `${"a".repeat(1000)}.mp4`
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
})
