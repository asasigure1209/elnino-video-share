import { PlayerDetailPage } from "../../../src/pages/player-detail";
import { MainLayout } from "../../../src/shared/ui";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <MainLayout>
      <PlayerDetailPage playerId={id} />
    </MainLayout>
  );
}
