import { PlayerList } from "../../widgets/player-list"

export function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[640px] mx-auto">
        {/* ヘッダー */}
        <header className="py-8 px-4">
          <h1 className="text-on-primary text-4xl font-bold text-center">
            エルニーニョ
          </h1>
          <p className="text-on-primary text-2xl font-bold text-center mt-2">
            vol.10
          </p>
        </header>

        {/* メインコンテンツ */}
        <main className="px-4 pb-8">
          <PlayerList />
        </main>
      </div>
    </div>
  )
}
