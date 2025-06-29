import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { HomePage } from "."

describe("Home", () => {
  it("renders the main heading", () => {
    render(<HomePage />)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent("エルニーニョ")
  })

  it("renders the version text", () => {
    render(<HomePage />)

    const versionText = screen.getByText("vol.10")
    expect(versionText).toBeInTheDocument()
  })

  it("renders player data", () => {
    render(<HomePage />)

    // プレイヤー名が表示されているか確認
    expect(screen.getByText("るくら")).toBeInTheDocument()
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
