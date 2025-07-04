"use client"

import {
  useActionState,
  useEffect,
  useId,
  useState,
  useTransition,
} from "react"
import { VIDEO_TYPES } from "../../../entities/video/types"
import { Button } from "../../../shared/ui/button"
import {
  type BulkConfirmUploadsState,
  type BulkGenerateUrlsState,
  bulkConfirmUploadsAction,
  bulkGenerateUploadUrlsAction,
} from "../actions"

interface UploadItem {
  file: File
  fileName: string
  uploadUrl?: string
  uploading: boolean
  uploaded: boolean
  error?: string
}

export function BulkUploadForm() {
  const videoTypeId = useId()
  const videoFilesId = useId()
  const [isPending, startTransition] = useTransition()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedType, setSelectedType] = useState<string>("")
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [currentStep, setCurrentStep] = useState<
    "select" | "upload" | "confirm"
  >("select")

  const [generateUrlsState, generateUrlsAction] = useActionState<
    BulkGenerateUrlsState,
    FormData
  >(bulkGenerateUploadUrlsAction, { success: false })

  const [confirmState, confirmAction] = useActionState<
    BulkConfirmUploadsState,
    FormData
  >(bulkConfirmUploadsAction, { success: false })

  // Handle generateUrlsState changes
  useEffect(() => {
    if (generateUrlsState.success && generateUrlsState.uploadItems) {
      const items: UploadItem[] = selectedFiles.map((file, _index) => {
        const uploadItem = generateUrlsState.uploadItems?.find(
          (item) => item.fileName === file.name,
        )
        return {
          file,
          fileName: file.name,
          uploadUrl: uploadItem?.uploadUrl,
          uploading: false,
          uploaded: false,
        }
      })
      setUploadItems(items)
      setCurrentStep("upload")
    }
  }, [generateUrlsState, selectedFiles])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0 || !selectedType) {
      return
    }

    const formData = new FormData()
    formData.append("fileCount", selectedFiles.length.toString())

    selectedFiles.forEach((file, index) => {
      formData.append(`fileName_${index}`, file.name)
      formData.append(`contentType_${index}`, file.type || "video/mp4")
      formData.append(`fileSize_${index}`, file.size.toString())
    })

    startTransition(() => {
      generateUrlsAction(formData)
    })
  }

  const handleUploadToR2 = async (file: File, uploadUrl: string) => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "video/mp4",
      },
    })

    if (!response.ok) {
      throw new Error(`アップロードに失敗: ${response.status}`)
    }
  }

  const handleUploadFiles = async () => {
    setCurrentStep("upload")

    const updatedItems = [...uploadItems]

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i]

      if (!item.uploadUrl) {
        item.error = "アップロードURLが無効です"
        continue
      }

      try {
        item.uploading = true
        item.error = undefined
        setUploadItems([...updatedItems])

        await handleUploadToR2(item.file, item.uploadUrl)

        item.uploading = false
        item.uploaded = true
        setUploadItems([...updatedItems])
      } catch (error) {
        item.uploading = false
        item.error =
          error instanceof Error ? error.message : "アップロードに失敗しました"
        setUploadItems([...updatedItems])
      }
    }

    // 全てのアップロードが完了したら確認ステップへ
    const allUploaded = updatedItems.every((item) => item.uploaded)
    if (allUploaded) {
      setCurrentStep("confirm")
    }
  }

  const handleConfirmRegistration = async () => {
    const formData = new FormData()
    formData.append("type", selectedType)

    uploadItems.forEach((item) => {
      if (item.uploaded) {
        formData.append("videoNames", item.fileName)
      }
    })

    startTransition(() => {
      confirmAction(formData)
    })
  }

  const resetForm = () => {
    setSelectedFiles([])
    setSelectedType("")
    setUploadItems([])
    setCurrentStep("select")
  }

  if (confirmState?.success) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold text-green-600 mb-4">
          一括アップロード完了
        </h2>
        <p className="text-on-surface/70 mb-6">
          {confirmState.videos?.length || 0}件の動画を登録しました
        </p>
        <div className="flex gap-4 justify-center">
          <Button href="/admin/videos" className="px-6 py-3">
            動画一覧に戻る
          </Button>
          <Button
            onClick={resetForm}
            className="px-6 py-3 bg-secondary text-white"
          >
            続けてアップロード
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {currentStep === "select" && (
        <div className="space-y-6">
          <div>
            <label
              htmlFor={videoTypeId}
              className="block text-sm font-medium text-on-surface mb-2"
            >
              動画タイプ
            </label>
            <select
              id={videoTypeId}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-3 border border-outline rounded-md bg-surface text-on-surface"
              required
            >
              <option value="">選択してください</option>
              {VIDEO_TYPES.map((type: string) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={videoFilesId}
              className="block text-sm font-medium text-on-surface mb-2"
            >
              動画ファイル（複数選択可）
            </label>
            <input
              id={videoFilesId}
              type="file"
              multiple
              accept=".mp4,.mov,.avi,.mkv"
              onChange={handleFileSelect}
              className="w-full p-3 border border-outline rounded-md bg-surface text-on-surface"
            />
            <p className="text-sm text-on-surface/70 mt-2">
              対応形式: .mp4, .mov, .avi, .mkv (最大2GB/ファイル)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-on-surface mb-3">
                選択されたファイル ({selectedFiles.length}件)
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex justify-between items-center p-3 bg-surface rounded-md border border-outline"
                  >
                    <div>
                      <div className="font-medium text-on-surface">
                        {file.name}
                      </div>
                      <div className="text-sm text-on-surface/70">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generateUrlsState?.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 whitespace-pre-line">
                {generateUrlsState.error}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleStartUpload}
              disabled={
                selectedFiles.length === 0 || !selectedType || isPending
              }
              className="px-6 py-3"
            >
              {isPending ? "処理中..." : "アップロード開始"}
            </Button>
            <Button
              href="/admin/videos"
              className="px-6 py-3 bg-gray-500 text-white"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {currentStep === "upload" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-on-surface">
              アップロード進行状況
            </h2>
            <div className="text-sm text-on-surface/70">
              {uploadItems.filter((item) => item.uploaded).length} /{" "}
              {uploadItems.length} 完了
            </div>
          </div>

          <div className="space-y-3">
            {uploadItems.map((item, index) => (
              <div
                key={`${item.fileName}-${index}`}
                className="p-4 bg-surface rounded-md border border-outline"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-on-surface">
                    {item.fileName}
                  </div>
                  <div className="text-sm">
                    {item.uploading && (
                      <span className="text-blue-600">アップロード中...</span>
                    )}
                    {item.uploaded && (
                      <span className="text-green-600">完了</span>
                    )}
                    {item.error && <span className="text-red-600">エラー</span>}
                  </div>
                </div>
                {item.error && (
                  <div className="text-sm text-red-600">{item.error}</div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleUploadFiles}
              disabled={uploadItems.some((item) => item.uploading)}
              className="px-6 py-3"
            >
              {uploadItems.some((item) => item.uploading)
                ? "アップロード中..."
                : "アップロード実行"}
            </Button>
            <Button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-500 text-white"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {currentStep === "confirm" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-on-surface">
            アップロード完了 - 登録確認
          </h2>

          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700">
              全ての動画ファイルのアップロードが完了しました。
              データベースに登録を行います。
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-on-surface mb-3">
              登録する動画 ({uploadItems.filter((item) => item.uploaded).length}
              件)
            </h3>
            <div className="space-y-2">
              {uploadItems
                .filter((item) => item.uploaded)
                .map((item, index) => (
                  <div
                    key={`${item.fileName}-uploaded-${index}`}
                    className="flex justify-between items-center p-3 bg-surface rounded-md border border-outline"
                  >
                    <div>
                      <div className="font-medium text-on-surface">
                        {item.fileName}
                      </div>
                      <div className="text-sm text-on-surface/70">
                        タイプ: {selectedType}
                      </div>
                    </div>
                    <div className="text-sm text-green-600">
                      アップロード済み
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {confirmState?.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 whitespace-pre-line">
                {confirmState.error}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleConfirmRegistration}
              disabled={isPending}
              className="px-6 py-3"
            >
              {isPending ? "登録中..." : "データベースに登録"}
            </Button>
            <Button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-500 text-white"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
