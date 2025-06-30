import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as playerApi from "../../entities/player/api"
import * as playerVideoApi from "../../entities/player-video/api"
import { PlayerDetailPage } from "./index"

// 依存モジュールをモック化
vi.mock("../../entities/player/api")
vi.mock("../../entities/player-video/api")

const mockGetPlayerById = vi.mocked(playerApi.getPlayerById)
const mockGetVideosByPlayerId = vi.mocked(playerVideoApi.getVideosByPlayerId)

describe("PlayerDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("プレイヤー詳細情報と動画一覧を表示する", async () => {
    const mockPlayer = { id: 1, name: "るぐら" }
    const mockVideos = [
      {
        id: 1,
        player_id: 1,
        video_id: 1,
        player_name: "るぐら",
        video_name: "DFSC0001.mp4",
        video_type: "予選",
      },
      {
        id: 2,
        player_id: 1,
        video_id: 2,
        player_name: "るぐら",
        video_name: "DFSC0002.mp4",
        video_type: "Best16",
      },
    ]

    mockGetPlayerById.mockResolvedValue(mockPlayer)
    mockGetVideosByPlayerId.mockResolvedValue(mockVideos)

    const ComponentWrapper = await PlayerDetailPage({ playerId: "1" })
    render(ComponentWrapper as React.ReactElement)

    // ページタイトルの確認
    expect(screen.getByText("エルニーニョ")).toBeInTheDocument()
    expect(screen.getByText("vol.10")).toBeInTheDocument()

    // プレイヤー名の確認
    expect(screen.getByText("るぐら")).toBeInTheDocument()

    // 動画一覧の確認
    expect(screen.getByText("DFSC0001.mp4")).toBeInTheDocument()
    expect(screen.getByText("DFSC0002.mp4")).toBeInTheDocument()
  })

  it("無効なプレイヤーIDの場合エラーメッセージを表示する", async () => {
    const ComponentWrapper = await PlayerDetailPage({ playerId: "invalid" })
    render(ComponentWrapper as React.ReactElement)

    expect(screen.getByText("無効なプレイヤーIDです")).toBeInTheDocument()
  })

  it("存在しないプレイヤーの場合エラーメッセージを表示する", async () => {
    mockGetPlayerById.mockResolvedValue(null)
    mockGetVideosByPlayerId.mockResolvedValue([])

    const ComponentWrapper = await PlayerDetailPage({ playerId: "999" })
    render(ComponentWrapper as React.ReactElement)

    expect(
      screen.getByText("プレイヤーが見つかりませんでした"),
    ).toBeInTheDocument()
  })

  it("データ取得エラーの場合エラーメッセージを表示する", async () => {
    mockGetPlayerById.mockRejectedValue(new Error("API Error"))

    const ComponentWrapper = await PlayerDetailPage({ playerId: "1" })
    render(ComponentWrapper as React.ReactElement)

    expect(
      screen.getByText("プレイヤーデータの読み込みに失敗しました"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("しばらく時間をおいてから再度お試しください"),
    ).toBeInTheDocument()
  })

  it("動画がないプレイヤーの場合、適切なメッセージを表示する", async () => {
    const mockPlayer = { id: 1, name: "るぐら" }
    mockGetPlayerById.mockResolvedValue(mockPlayer)
    mockGetVideosByPlayerId.mockResolvedValue([])

    const ComponentWrapper = await PlayerDetailPage({ playerId: "1" })
    render(ComponentWrapper as React.ReactElement)

    expect(screen.getByText("るぐら")).toBeInTheDocument()
    expect(
      screen.getByText("このプレイヤーの動画はまだ登録されていません"),
    ).toBeInTheDocument()
  })
})
