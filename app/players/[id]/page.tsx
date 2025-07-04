import { getPlayers } from "../../../src/entities/player/api";
import { PlayerDetailPage } from "../../../src/pages/player-detail";
import { MainLayout } from "../../../src/shared/ui";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// ビルド時に全プレイヤーIDの静的パラメータを生成
export async function generateStaticParams() {
  try {
    const players = await getPlayers();
    return players.map((player) => ({
      id: player.id.toString(),
    }));
  } catch (error) {
    console.error("Error generating static params for players:", error);
    // ビルドエラーを防ぐため、空配列を返す
    return [];
  }
}

// 定義されていないパラメータでのアクセスを拒否（404になる）
export const dynamicParams = false;
// 1時間ごとにISR（Incremental Static Regeneration）で再生成
export const revalidate = 3600;

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;
  const playerId = Number(id);

  const players = await getPlayers();
  const targetPlayer = players.find((player) => player.id === playerId);

  return (
    <MainLayout>
      <PlayerDetailPage player={targetPlayer} />
    </MainLayout>
  );
}
