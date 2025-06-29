import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Player } from "../../entities/player/types"
import { MainLayout } from "../../shared/ui"
import { HomePage } from "."

// Player API のモック
const mockGetPlayers = vi.hoisted(() => vi.fn())

vi.mock("../../entities/player/api", () => ({
  getPlayers: mockGetPlayers,
}))

describe("Home", () => {
  const mockPlayers: Player[] = [
    { id: 1, name: "るぐら" },
    { id: 2, name: "風龍" },
    { id: 3, name: "せせらぎ" },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPlayers.mockResolvedValue(mockPlayers)
  })

  it("renders the main logo when wrapped in MainLayout", async () => {
    const HomePageComponent = await HomePage()
    render(<MainLayout>{HomePageComponent}</MainLayout>)

    const logo = screen.getByAltText("エルニーニョ vol.10")
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute("src", "/mainLogo.svg")
  })

  it("renders player data", async () => {
    const HomePageComponent = await HomePage()
    render(HomePageComponent)

    // プレイヤー名が表示されているか確認
    expect(screen.getByText("るぐら")).toBeInTheDocument()
    expect(screen.getByText("風龍")).toBeInTheDocument()
    expect(screen.getByText("せせらぎ")).toBeInTheDocument()

    // IDが表示されているか確認（entryNoの代わり）
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()

    // 動画ボタンが表示されているか確認
    const videoButtons = screen.getAllByText("動画")
    expect(videoButtons).toHaveLength(3)
  })

  it("renders table headers", async () => {
    const HomePageComponent = await HomePage()
    render(HomePageComponent)

    expect(screen.getByText("No")).toBeInTheDocument()
    expect(screen.getByText("エントリー名")).toBeInTheDocument()
  })

  it("renders error message when API call fails", async () => {
    mockGetPlayers.mockRejectedValue(new Error("API Error"))

    const HomePageComponent = await HomePage()
    render(HomePageComponent)

    expect(
      screen.getByText("プレイヤーデータの読み込みに失敗しました"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("しばらく時間をおいてから再度お試しください"),
    ).toBeInTheDocument()
  })
})
