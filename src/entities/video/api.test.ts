import { beforeEach, describe, expect, it, vi } from "vitest"
import * as googleSheetsApi from "../../shared/api/google-sheets"
import {
  createVideo,
  deleteVideo,
  getVideoById,
  getVideos,
  updateVideo,
} from "./api"

// Google Sheets API をモック化
vi.mock("../../shared/api/google-sheets")

const mockGetSheetData = vi.mocked(googleSheetsApi.getSheetData)
const mockAppendSheetData = vi.mocked(googleSheetsApi.appendSheetData)
const mockUpdateSheetData = vi.mocked(googleSheetsApi.updateSheetData)

describe("Video API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getVideos", () => {
    it("動画一覧を正しく取得できる", async () => {
      const mockData = [
        ["id", "name", "type"], // ヘッダー行
        [1, "DFSC0001.mp4", "予選"],
        [2, "DFSC0002.mp4", "Best16"],
        [3, "DFSC0003.mp4", "Best8"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      const result = await getVideos()

      expect(mockGetSheetData).toHaveBeenCalledWith("videos")
      expect(result).toEqual([
        { id: 1, name: "DFSC0001.mp4", type: "予選" },
        { id: 2, name: "DFSC0002.mp4", type: "Best16" },
        { id: 3, name: "DFSC0003.mp4", type: "Best8" },
      ])
    })

    it("無効なデータを除外する", async () => {
      const mockData = [
        ["id", "name", "type"], // ヘッダー行
        [1, "DFSC0001.mp4", "予選"],
        [0, "invalid.mp4", "予選"], // id が 0
        [2, "", "Best16"], // name が空
        [3, "DFSC0003.mp4", ""], // type が空
        [4, "DFSC0004.mp4", "Best8"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      const result = await getVideos()

      expect(result).toEqual([
        { id: 1, name: "DFSC0001.mp4", type: "予選" },
        { id: 4, name: "DFSC0004.mp4", type: "Best8" },
      ])
    })

    it("API エラー時に適切なエラーメッセージを投げる", async () => {
      mockGetSheetData.mockRejectedValue(new Error("API Error"))

      await expect(getVideos()).rejects.toThrow(
        "動画データの取得に失敗しました",
      )
    })
  })

  describe("getVideoById", () => {
    it("指定されたIDの動画を取得できる", async () => {
      const mockData = [
        ["id", "name", "type"],
        [1, "DFSC0001.mp4", "予選"],
        [2, "DFSC0002.mp4", "Best16"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      const result = await getVideoById(2)

      expect(result).toEqual({ id: 2, name: "DFSC0002.mp4", type: "Best16" })
    })

    it("存在しないIDの場合nullを返す", async () => {
      const mockData = [
        ["id", "name", "type"],
        [1, "DFSC0001.mp4", "予選"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      const result = await getVideoById(999)

      expect(result).toBeNull()
    })
  })

  describe("createVideo", () => {
    it("新しい動画を作成できる", async () => {
      const mockData = [
        ["id", "name", "type"],
        [1, "DFSC0001.mp4", "予選"],
        [2, "DFSC0002.mp4", "Best16"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)
      mockAppendSheetData.mockResolvedValue({})

      const newVideo = {
        name: "DFSC0003.mp4",
        type: "TOP8" as const,
      }

      const result = await createVideo(newVideo)

      expect(mockAppendSheetData).toHaveBeenCalledWith("videos", [
        [3, "DFSC0003.mp4", "TOP8"],
      ])
      expect(result).toEqual({
        id: 3,
        name: "DFSC0003.mp4",
        type: "TOP8",
      })
    })

    it("空のリストの場合、ID 1 から開始する", async () => {
      const mockData = [["id", "name", "type"]] // ヘッダーのみ
      mockGetSheetData.mockResolvedValue(mockData)
      mockAppendSheetData.mockResolvedValue({})

      const newVideo = {
        name: "DFSC0001.mp4",
        type: "予選" as const,
      }

      const result = await createVideo(newVideo)

      expect(mockAppendSheetData).toHaveBeenCalledWith("videos", [
        [1, "DFSC0001.mp4", "予選"],
      ])
      expect(result.id).toBe(1)
    })
  })

  describe("updateVideo", () => {
    it("動画情報を更新できる", async () => {
      const mockData = [
        ["id", "name", "type"],
        [1, "DFSC0001.mp4", "予選"],
        [2, "DFSC0002.mp4", "Best16"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)
      mockUpdateSheetData.mockResolvedValue({})

      const updateData = {
        id: 2,
        name: "DFSC0002_updated.mp4",
        type: "TOP8" as const,
      }

      const result = await updateVideo(updateData)

      expect(mockUpdateSheetData).toHaveBeenCalledWith(
        "videos",
        "A3:C3", // 2番目のデータ行（ヘッダー+1+インデックス）
        [[2, "DFSC0002_updated.mp4", "TOP8"]],
      )
      expect(result).toEqual(updateData)
    })

    it("存在しない動画IDの場合エラーを投げる", async () => {
      const mockData = [
        ["id", "name", "type"],
        [1, "DFSC0001.mp4", "予選"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      const updateData = {
        id: 999,
        name: "nonexistent.mp4",
        type: "予選" as const,
      }

      await expect(updateVideo(updateData)).rejects.toThrow(
        "指定された動画が見つかりません",
      )
    })
  })

  describe("deleteVideo", () => {
    it("動画を削除（無効化）できる", async () => {
      const mockData = [
        ["id", "name", "type"],
        [1, "DFSC0001.mp4", "予選"],
        [2, "DFSC0002.mp4", "Best16"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)
      mockUpdateSheetData.mockResolvedValue({})

      await deleteVideo(2)

      expect(mockUpdateSheetData).toHaveBeenCalledWith("videos", "B3", [[""]])
    })

    it("存在しない動画IDの場合エラーを投げる", async () => {
      const mockData = [
        ["id", "name", "type"],
        [1, "DFSC0001.mp4", "予選"],
      ]
      mockGetSheetData.mockResolvedValue(mockData)

      await expect(deleteVideo(999)).rejects.toThrow(
        "指定された動画が見つかりません",
      )
    })
  })
})
