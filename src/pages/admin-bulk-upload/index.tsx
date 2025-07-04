import { BulkUploadForm } from "../../features/manage-videos/components/bulk-upload-form"

export function AdminBulkUploadPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-primary mb-2">
          動画一括アップロード
        </h1>
        <p className="text-on-surface/70">
          同じタイプの動画を複数同時にアップロードできます。プレイヤーの紐づけは後で個別に設定してください。
        </p>
      </div>

      <BulkUploadForm />
    </div>
  )
}
