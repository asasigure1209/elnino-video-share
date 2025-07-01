import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AdminDashboardPage } from "./index"

describe("AdminDashboardPage", () => {
  it("管理者ダッシュボードのタイトルを表示する", () => {
    // Given: AdminDashboardPageコンポーネントをレンダリング
    render(<AdminDashboardPage />)

    // When: タイトルを探す
    const title = screen.getByRole("heading", { name: "管理者ダッシュボード" })

    // Then: タイトルが表示される
    expect(title).toBeInTheDocument()
  })

  it("説明文を表示する", () => {
    // Given: AdminDashboardPageコンポーネントをレンダリング
    render(<AdminDashboardPage />)

    // When: 説明文を探す
    const description = screen.getByText("プレイヤーや動画の管理を行えます")

    // Then: 説明文が表示される
    expect(description).toBeInTheDocument()
  })

  it("プレイヤー管理ボタンを表示する", () => {
    // Given: AdminDashboardPageコンポーネントをレンダリング
    render(<AdminDashboardPage />)

    // When: プレイヤーボタンを探す
    const playerButton = screen.getByRole("link", { name: "プレイヤー" })

    // Then: 正しいリンクが設定されている
    expect(playerButton).toBeInTheDocument()
    expect(playerButton).toHaveAttribute("href", "/admin/players")
  })

  it("動画管理ボタンを表示する", () => {
    // Given: AdminDashboardPageコンポーネントをレンダリング
    render(<AdminDashboardPage />)

    // When: 動画ボタンを探す
    const videoButton = screen.getByRole("link", { name: "動画" })

    // Then: 正しいリンクが設定されている
    expect(videoButton).toBeInTheDocument()
    expect(videoButton).toHaveAttribute("href", "/admin/videos")
  })

  it("管理者ナビゲーションが含まれている", () => {
    // Given: AdminDashboardPageコンポーネントをレンダリング
    render(<AdminDashboardPage />)

    // When: ナビゲーションボタンを探す
    const navButtons = screen.getAllByRole("link")

    // Then: プレイヤーと動画の2つのナビゲーションボタンが存在する
    expect(navButtons).toHaveLength(2)
  })
})
