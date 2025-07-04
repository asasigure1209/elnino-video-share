"use client"

import { useRouter } from "next/navigation"
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useState,
  useTransition,
} from "react"
import type { Player } from "../../../entities/player/types"
import type { VideoType } from "../../../entities/video/types"
import { Button } from "../../../shared/ui/button"
import type { ConfirmUploadState, GenerateUploadUrlState } from "../actions"
import { confirmUploadAction, generateUploadUrlAction } from "../actions"

const initialUploadUrlState: GenerateUploadUrlState = {
  success: false,
}

const initialConfirmState: ConfirmUploadState = {
  success: false,
}

const VIDEO_TYPES: VideoType[] = [
  "予選",
  "TOP16",
  "TOP8",
  "TOP4",
  "3位決定戦",
  "決勝戦",
]

interface CreateVideoFormProps {
  players: Player[]
}

export function CreateVideoForm({ players }: CreateVideoFormProps) {
  const fileId = useId()
  const typeId = useId()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [uploadUrlState, generateUrlAction, isGeneratingUrl] = useActionState(
    generateUploadUrlAction,
    initialUploadUrlState,
  )
  const [confirmState, confirmAction, isConfirming] = useActionState(
    confirmUploadAction,
    initialConfirmState,
  )
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // エラーがある場合はアラート表示、成功時はリダイレクト
  useEffect(() => {
    if (uploadUrlState.error) {
      alert(uploadUrlState.error)
    }
    if (confirmState.error) {
      alert(confirmState.error)
    }
    if (confirmState.success) {
      // 成功時は動画一覧ページにリダイレクト
      router.push("/admin/videos")
    }
  }, [uploadUrlState.error, confirmState.error, confirmState.success, router])

  const handlePlayerToggle = (playerId: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSelectedFile(file || null)
    setUploadProgress(0)
    setUploadError(null)
  }

  const handleUploadToR2 = useCallback(
    async (uploadUrl: string, file: File) => {
      setIsUploading(true)
      setUploadProgress(0)
      setUploadError(null)

      try {
        const xhr = new XMLHttpRequest()

        return new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded * 100) / event.total)
              setUploadProgress(progress)
            }
          })

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          })

          xhr.addEventListener("error", () => {
            reject(new Error("Upload failed"))
          })

          xhr.open("PUT", uploadUrl)
          xhr.setRequestHeader("Content-Type", file.type)
          xhr.send(file)
        })
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "アップロードに失敗しました",
        )
        throw error
      } finally {
        setIsUploading(false)
      }
    },
    [],
  )

  const handleGenerateUploadUrl = (formData: FormData) => {
    // Client-side validation before calling server action
    if (!selectedFile || !selectedType || selectedPlayers.length === 0) {
      alert("すべての項目を入力してください")
      return
    }

    // Add file information to the form data
    formData.append("fileName", selectedFile.name)
    formData.append("contentType", selectedFile.type)
    formData.append("fileSize", selectedFile.size.toString())

    // Add selected type and players as hidden fields
    formData.append("type", selectedType)
    selectedPlayers.forEach((playerId) => {
      formData.append("playerIds", playerId.toString())
    })

    generateUrlAction(formData)
  }

  // Handle upload URL generation success
  useEffect(() => {
    if (
      uploadUrlState.success &&
      uploadUrlState.uploadUrl &&
      uploadUrlState.videoName &&
      selectedFile
    ) {
      const performUpload = async () => {
        try {
          // Step 2: Upload to R2
          await handleUploadToR2(uploadUrlState.uploadUrl!, selectedFile)

          // Step 3: Confirm upload
          const confirmFormData = new FormData()
          confirmFormData.append("videoName", uploadUrlState.videoName!)
          confirmFormData.append("type", selectedType)
          selectedPlayers.forEach((playerId) => {
            confirmFormData.append("playerIds", playerId.toString())
          })

          startTransition(() => {
            confirmAction(confirmFormData)
          })
        } catch (error) {
          console.error("Upload failed:", error)
          setUploadError(
            error instanceof Error
              ? error.message
              : "アップロードに失敗しました",
          )
        }
      }

      performUpload()
    }
  }, [
    uploadUrlState.success,
    uploadUrlState.uploadUrl,
    uploadUrlState.videoName,
    selectedFile,
    selectedType,
    selectedPlayers,
    handleUploadToR2,
    confirmAction,
  ])

  const isDisabled = isGeneratingUrl || isUploading || isConfirming || isPending

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-on-primary mb-6 text-center">
        動画新規登録
      </h2>

      <form action={handleGenerateUploadUrl} className="space-y-6">
        {/* ファイル選択 */}
        <div>
          <label
            htmlFor={fileId}
            className="block text-sm font-medium text-on-surface mb-2"
          >
            動画ファイル *
          </label>
          <input
            type="file"
            id={fileId}
            name="file"
            accept=".mp4,.mov,.avi,.mkv"
            required
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-hover"
            disabled={isDisabled}
          />
          {selectedFile && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-on-surface/70">
                選択されたファイル: {selectedFile.name} (
                {Math.round(selectedFile.size / 1024 / 1024)}MB)
              </p>
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              {isUploading && (
                <p className="text-sm text-primary font-medium">
                  アップロード中... {uploadProgress}%
                </p>
              )}
              {uploadError && (
                <p className="text-sm text-red-600">エラー: {uploadError}</p>
              )}
            </div>
          )}
          <p className="mt-1 text-xs text-on-surface/50">
            対応形式: .mp4, .mov, .avi, .mkv (最大2GB)
          </p>
        </div>

        {/* タイプ選択 */}
        <div>
          <label
            htmlFor={typeId}
            className="block text-sm font-medium text-on-surface mb-2"
          >
            タイプ *
          </label>
          <select
            id={typeId}
            name="type"
            required
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isDisabled}
          >
            <option value="">タイプを選択してください</option>
            {VIDEO_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* プレイヤー選択 */}
        <fieldset>
          <legend className="block text-sm font-medium text-on-surface mb-2">
            プレイヤー * (複数選択可)
          </legend>
          <div className="border border-outline rounded-md bg-surface p-3 max-h-64 overflow-y-auto">
            {players.length === 0 ? (
              <p className="text-on-surface/50 text-sm">
                プレイヤーが登録されていません
              </p>
            ) : (
              <div className="space-y-2">
                {players.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="playerIds"
                      value={player.id}
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => handlePlayerToggle(player.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-outline rounded"
                      disabled={isDisabled}
                    />
                    <span className="text-on-surface">{player.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedPlayers.length > 0 && (
            <p className="mt-2 text-sm text-on-surface/70">
              {selectedPlayers.length}人のプレイヤーが選択されています
            </p>
          )}
        </fieldset>

        {/* 送信ボタン */}
        <div className="text-center">
          <Button
            type="submit"
            size="lg"
            className="bg-on-primary hover:bg-primary-hover text-primary px-8 py-3 font-bold"
            disabled={
              isDisabled ||
              !selectedFile ||
              selectedPlayers.length === 0 ||
              !selectedType
            }
          >
            {isGeneratingUrl
              ? "準備中..."
              : isUploading
                ? `アップロード中... ${uploadProgress}%`
                : isConfirming
                  ? "登録中..."
                  : "新規登録"}
          </Button>
        </div>
      </form>
    </div>
  )
}
