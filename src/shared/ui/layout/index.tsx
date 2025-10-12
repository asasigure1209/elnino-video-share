import Image from "next/image"
import type { ReactNode } from "react"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/background.JPG)" }}
    >
      <div className="flex flex-col flex-1">
        {/* ヘッダー */}
        <header className="py-8 px-4">
          <div className="text-center">
            <Image
              src="/mainLogo.svg"
              alt="RECSTAR"
              width={400}
              height={120}
              className="mx-auto max-w-full h-auto"
              priority
            />
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="bg-surface/70 px-4 py-8 flex-1">
          <div className="max-w-[640px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
