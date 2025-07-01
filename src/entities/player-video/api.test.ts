import { beforeEach, describe, expect, it, vi } from "vitest"
import * as googleSheetsApi from "../../shared/api/google-sheets"
import * as playerApi from "../player/api"
import * as videoApi from "../video/api"
import {
  createPlayerVideo,
  deletePlayerVideo,
  getPlayerVideos,
  getVideosByPlayerId,
  updatePlayerVideo,
} from "./api"

// 依存モジュールをモック化
vi.mock("../../shared/api/google-sheets")
vi.mock("../player/api")
vi.mock("../video/api")

const mockGetSheetData = vi.mocked(googleSheetsApi.getSheetData)
const mockAppendSheetData = vi.mocked(googleSheetsApi.appendSheetData)
const mockUpdateSheetData = vi.mocked(googleSheetsApi.updateSheetData)
const mockGetPlayers = vi.mocked(playerApi.getPlayers)
const mockGetVideos = vi.mocked(videoApi.getVideos)

describe("PlayerVideo API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getPlayerVideos", () => {
    it("プレイヤー-動画マッピング一覧を正しく取得できる", async () => {
      const mockData = [
        ["id", "player_id", "video_id"], // ヘッダー行
        [1, 1, 1],
        [2, 1, 2],
        [3, 2, 1],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      const result = await getPlayerVideos()

      expect(mockGetSheetData).toHaveBeenCalledWith("player_videos")
      expect(result).toEqual([
        { id: 1, player_id: 1, video_id: 1 },
        { id: 2, player_id: 1, video_id: 2 },
        { id: 3, player_id: 2, video_id: 1 },
      ])
    })

    it("無効なデータを除外する", async () => {
      const mockData = [
        ["id", "player_id", "video_id"], // ヘッダー行
        [1, 1, 1],
        [0, 1, 2], // id が 0
        [2, 0, 1], // player_id が 0
        [3, 1, 0], // video_id が 0
        [4, 2, 2],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      const result = await getPlayerVideos()

      expect(result).toEqual([
        { id: 1, player_id: 1, video_id: 1 },
        { id: 4, player_id: 2, video_id: 2 },
      ])
    })

    it("API エラー時に適切なエラーメッセージを投げる", async () => {
      mockGetSheetData.mockRejectedValue(new Error("API Error"))

      await expect(getPlayerVideos()).rejects.toThrow(
        "プレイヤー-動画データの取得に失敗しました",
      )
    })
  })

  describe("getVideosByPlayerId", () => {
    it("指定されたプレイヤーの動画一覧を取得できる", async () => {
      // モックデータ
      const _mockPlayerVideos = [
        { id: 1, player_id: 1, video_id: 1 },
        { id: 2, player_id: 1, video_id: 2 },
        { id: 3, player_id: 2, video_id: 1 },
      ]

      const mockPlayers = [
        { id: 1, name: "るぐら" },
        { id: 2, name: "風龍" },
      ]

      const mockVideos = [
        { id: 1, name: "DFSC0001.mp4", type: "予選" },
        { id: 2, name: "DFSC0002.mp4", type: "Best16" },
      ]

      mockGetSheetData.mockResolvedValue([
        ["id", "player_id", "video_id"],
        [1, 1, 1],
        [2, 1, 2],
        [3, 2, 1],
      ])
      mockGetPlayers.mockResolvedValue(mockPlayers)
      mockGetVideos.mockResolvedValue(mockVideos)

      const result = await getVideosByPlayerId(1)

      expect(result).toEqual([
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
      ])
    })

    it("該当するプレイヤーの動画がない場合、空配列を返す", async () => {
      mockGetSheetData.mockResolvedValue([
        ["id", "player_id", "video_id"],
        [1, 1, 1],
      ])
      mockGetPlayers.mockResolvedValue([{ id: 1, name: "るぐら" }])
      mockGetVideos.mockResolvedValue([
        { id: 1, name: "DFSC0001.mp4", type: "予選" },
      ])

      const result = await getVideosByPlayerId(999)

      expect(result).toEqual([])
    })

    it("プレイヤーまたは動画が見つからない場合、該当項目を除外する", async () => {
      const _mockPlayerVideos = [
        { id: 1, player_id: 1, video_id: 1 },
        { id: 2, player_id: 1, video_id: 999 }, // 存在しない動画
      ]

      mockGetSheetData.mockResolvedValue([
        ["id", "player_id", "video_id"],
        [1, 1, 1],
        [2, 1, 999],
      ])
      mockGetPlayers.mockResolvedValue([{ id: 1, name: "るぐら" }])
      mockGetVideos.mockResolvedValue([
        { id: 1, name: "DFSC0001.mp4", type: "予選" },
      ])

      const result = await getVideosByPlayerId(1)

      expect(result).toEqual([
        {
          id: 1,
          player_id: 1,
          video_id: 1,
          player_name: "るぐら",
          video_name: "DFSC0001.mp4",
          video_type: "予選",
        },
      ])
    })
  })

  describe("createPlayerVideo", () => {
    it("新しいプレイヤー-動画マッピングを作成できる", async () => {
      const mockData = [
        ["id", "player_id", "video_id"],
        [1, 1, 1],
        [2, 1, 2],
      ]
      mockGetSheetData.mockResolvedValue(mockData)
      mockAppendSheetData.mockResolvedValue({})

      const newMapping = {
        player_id: 2,
        video_id: 1,
      }

      const result = await createPlayerVideo(newMapping)

      expect(mockAppendSheetData).toHaveBeenCalledWith("player_videos", [
        [3, 2, 1],
      ])
      expect(result).toEqual({
        id: 3,
        player_id: 2,
        video_id: 1,
      })
    })

    it("空のリストの場合、ID 1 から開始する", async () => {
      const mockData = [["id", "player_id", "video_id"]] // ヘッダーのみ
      mockGetSheetData.mockResolvedValue(mockData)
      mockAppendSheetData.mockResolvedValue({})

      const newMapping = {
        player_id: 1,
        video_id: 1,
      }

      const result = await createPlayerVideo(newMapping)

      expect(mockAppendSheetData).toHaveBeenCalledWith("player_videos", [
        [1, 1, 1],
      ])
      expect(result.id).toBe(1)
    })
  })

  describe("updatePlayerVideo", () => {
    it("プレイヤー-動画マッピングを更新できる", async () => {
      const mockData = [
        ["id", "player_id", "video_id"],
        [1, 1, 1],
        [2, 1, 2],
      ]
      mockGetSheetData.mockResolvedValue(mockData)
      mockUpdateSheetData.mockResolvedValue({})

      const updateData = {
        id: 2,
        player_id: 2,
        video_id: 1,
      }

      const result = await updatePlayerVideo(updateData)

      expect(mockUpdateSheetData).toHaveBeenCalledWith(
        "player_videos",
        "A3:C3", // 2番目のデータ行
        [[2, 2, 1]],
      )
      expect(result).toEqual(updateData)
    })

    it("存在しないマッピングIDの場合エラーを投げる", async () => {
      const mockData = [
        ["id", "player_id", "video_id"],
        [1, 1, 1],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      const updateData = {
        id: 999,
        player_id: 1,
        video_id: 1,
      }

      await expect(updatePlayerVideo(updateData)).rejects.toThrow(
        "指定されたマッピングが見つかりません",
      )
    })
  })

  describe("deletePlayerVideo", () => {
    it("プレイヤー-動画マッピングを削除（無効化）できる", async () => {
      const mockData = [
        ["id", "player_id", "video_id"],
        [1, 1, 1],
        [2, 1, 2],
      ]
      mockGetSheetData.mockResolvedValue(mockData)
      mockUpdateSheetData.mockResolvedValue({})

      await deletePlayerVideo(2)

      expect(mockUpdateSheetData).toHaveBeenCalledWith("player_videos", "B3", [
        [0],
      ])
    })

    it("存在しないマッピングIDの場合エラーを投げる", async () => {
      const mockData = [
        ["id", "player_id", "video_id"],
        [1, 1, 1],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      await expect(deletePlayerVideo(999)).rejects.toThrow(
        "指定されたマッピングが見つかりません",
      )
    })
  })
})
