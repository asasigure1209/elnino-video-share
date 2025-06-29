import { HomePage } from "../src/pages/home";
import { MainLayout } from "../src/shared/ui";

export default function RootPage() {
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}
