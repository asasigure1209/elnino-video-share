import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import Home from "./page"

describe("Home", () => {
  it("renders the main heading", () => {
    render(<Home />)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent("エルニーニョ動画配布サイト")
  })

  it("renders the player list section", () => {
    render(<Home />)

    const playerListHeading = screen.getByRole("heading", { level: 2 })
    expect(playerListHeading).toHaveTextContent(/プレイヤー一覧/)
  })

  it("renders the description text", () => {
    render(<Home />)

    const description = screen.getByText("参加プレイヤーの一覧を表示します")
    expect(description).toBeInTheDocument()
  })
})
