import { HomePage } from "../src/pages/home";
import { MainLayout } from "../src/shared/ui";

// TOPページをSSG（Static Site Generation）として強制的に静的生成
export const dynamic = 'force-static'
// 1時間ごとにISR（Incremental Static Regeneration）で再生成
export const revalidate = 3600

export default function RootPage() {
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}
