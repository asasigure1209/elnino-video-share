import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// 環境変数の取得
function getR2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME
  const region = process.env.CLOUDFLARE_R2_REGION || "auto"

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "Cloudflare R2 configuration is missing. Please set CLOUDFLARE_R2_* environment variables.",
    )
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    region,
  }
}

// R2クライアントの初期化
function getR2Client() {
  const config = getR2Config()

  return new S3Client({
    region: config.region,
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

// 動画ファイルが存在するかチェック
export async function checkVideoExists(videoName: string): Promise<boolean> {
  try {
    const client = getR2Client()
    const config = getR2Config()

    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: videoName,
    })

    await client.send(command)
    return true
  } catch (error) {
    console.error(`Error checking video existence for ${videoName}:`, error)
    return false
  }
}

// 動画のダウンロード用署名付きURLを生成
export async function generateDownloadUrl(
  videoName: string,
  expiresIn: number = 3600, // デフォルト1時間
): Promise<string> {
  try {
    const client = getR2Client()
    const config = getR2Config()

    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: videoName,
    })

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn,
    })

    return signedUrl
  } catch (error) {
    console.error(`Error generating download URL for ${videoName}:`, error)
    throw new Error("動画のダウンロードURLの生成に失敗しました")
  }
}

// 動画ファイルの情報を取得
export async function getVideoMetadata(videoName: string) {
  try {
    const client = getR2Client()
    const config = getR2Config()

    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: videoName,
    })

    const response = await client.send(command)

    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      etag: response.ETag,
    }
  } catch (error) {
    console.error(`Error getting video metadata for ${videoName}:`, error)
    throw new Error("動画ファイル情報の取得に失敗しました")
  }
}

// 動画ファイルをアップロード
export async function uploadVideo(
  videoName: string,
  fileBuffer: Buffer,
  contentType: string,
): Promise<void> {
  try {
    const client = getR2Client()
    const config = getR2Config()

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: videoName,
      Body: fileBuffer,
      ContentType: contentType,
    })

    await client.send(command)
  } catch (error) {
    console.error(`Error uploading video ${videoName}:`, error)
    throw new Error("動画ファイルのアップロードに失敗しました")
  }
}

// 動画ファイルを削除
export async function deleteVideo(videoName: string): Promise<void> {
  try {
    const client = getR2Client()
    const config = getR2Config()

    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: videoName,
    })

    await client.send(command)
  } catch (error) {
    console.error(`Error deleting video ${videoName}:`, error)
    throw new Error("動画ファイルの削除に失敗しました")
  }
}
