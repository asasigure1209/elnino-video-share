import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AdminNavigation } from "./index"

describe("AdminNavigation", () => {
  it("プレイヤー管理ボタンを表示する", () => {
    // Given: AdminNavigationコンポーネントをレンダリング
    render(<AdminNavigation />)

    // When: プレイヤーボタンを探す
    const playerButton = screen.getByRole("link", { name: "プレイヤー" })

    // Then: 正しいリンクが設定されている
    expect(playerButton).toBeInTheDocument()
    expect(playerButton).toHaveAttribute("href", "/admin/players")
  })

  it("動画管理ボタンを表示する", () => {
    // Given: AdminNavigationコンポーネントをレンダリング
    render(<AdminNavigation />)

    // When: 動画ボタンを探す
    const videoButton = screen.getByRole("link", { name: "動画" })

    // Then: 正しいリンクが設定されている
    expect(videoButton).toBeInTheDocument()
    expect(videoButton).toHaveAttribute("href", "/admin/videos")
  })

  it("2つのナビゲーションボタンが正しく表示される", () => {
    // Given: AdminNavigationコンポーネントをレンダリング
    render(<AdminNavigation />)

    // When: すべてのリンクボタンを取得
    const linkButtons = screen.getAllByRole("link")

    // Then: 2つのボタンが存在する
    expect(linkButtons).toHaveLength(2)
  })
})
