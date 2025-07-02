import { notFound } from "next/navigation"
import { getPlayerById } from "../../../../../src/entities/player/api"
import { AdminPlayersEditPage } from "../../../../../src/pages/admin-players-edit"
import { MainLayout } from "../../../../../src/shared/ui"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlayersEditAdminPage({ params }: PageProps) {
  try {
    const { id } = await params
    const playerId = Number(id)

    // IDの妥当性チェック
    if (Number.isNaN(playerId) || playerId <= 0) {
      notFound()
    }

    // プレイヤーデータを取得
    const player = await getPlayerById(playerId)

    // プレイヤーが見つからない場合は404
    if (!player) {
      notFound()
    }

    return (
      <MainLayout>
        <AdminPlayersEditPage player={player} />
      </MainLayout>
    )
  } catch (error) {
    console.error("Error loading player for edit:", error)
    
    return (
      <MainLayout>
        <div className="w-full text-center py-8">
          <h2 className="text-xl font-bold text-on-primary mb-4">
            エラーが発生しました
          </h2>
          <p className="text-on-surface/70">
            プレイヤーデータの読み込みに失敗しました。
          </p>
        </div>
      </MainLayout>
    )
  }
}