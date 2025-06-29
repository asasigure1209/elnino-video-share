import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MainLayout } from "../../shared/ui"
import { HomePage } from "."

describe("Home", () => {
  it("renders the main logo when wrapped in MainLayout", () => {
    render(
      <MainLayout>
        <HomePage />
      </MainLayout>,
    )

    const logo = screen.getByAltText("エルニーニョ vol.10")
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute("src", "/mainLogo.svg")
  })

  it("renders player data", () => {
    render(<HomePage />)

    // プレイヤー名が表示されているか確認
    expect(screen.getByText("るぐら")).toBeInTheDocument()
    expect(screen.getByText("風龍")).toBeInTheDocument()
    expect(screen.getByText("せせらぎ")).toBeInTheDocument()

    // 動画ボタンが表示されているか確認
    const videoButtons = screen.getAllByText("動画")
    expect(videoButtons).toHaveLength(3)
  })

  it("renders table headers", () => {
    render(<HomePage />)

    expect(screen.getByText("No")).toBeInTheDocument()
    expect(screen.getByText("エントリー名")).toBeInTheDocument()
  })
})
