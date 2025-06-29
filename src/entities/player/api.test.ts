import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CreatePlayerData, Player, UpdatePlayerData } from "./types"

// vitest hoisted で定義したモック
const mockGetSheetData = vi.hoisted(() => vi.fn())
const mockAppendSheetData = vi.hoisted(() => vi.fn())
const mockUpdateSheetData = vi.hoisted(() => vi.fn())

vi.mock("../../shared/api/google-sheets", () => ({
  getSheetData: mockGetSheetData,
  appendSheetData: mockAppendSheetData,
  updateSheetData: mockUpdateSheetData,
}))

// React cache のモック（実際の関数をそのまま返すように）
vi.mock("react", () => ({
  cache: (fn: any) => fn,
}))

// モック対象のインポート
import {
  createPlayer,
  deletePlayer,
  getPlayerById,
  getPlayers,
  updatePlayer,
} from "./api"

describe("Player API", () => {
  beforeEach(() => {
    // Given: 各テスト前にモックをリセット
    vi.clearAllMocks()
  })

  describe("getPlayers", () => {
    it("should return list of players successfully", async () => {
      // Given: 正常なプレイヤーデータがシートに存在する
      const mockSheetData = [
        ["id", "name"], // ヘッダー行
        ["1", "るぐら"],
        ["2", "風龍"],
        ["3", "せせらぎ"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)

      // When: プレイヤー一覧を取得する
      const result = await getPlayers()

      // Then: 正しいプレイヤーデータが返される
      const expected: Player[] = [
        { id: 1, name: "るぐら" },
        { id: 2, name: "風龍" },
        { id: 3, name: "せせらぎ" },
      ]
      expect(result).toEqual(expected)
      expect(mockGetSheetData).toHaveBeenCalledWith("players")
    })

    it("should return empty array when no data exists", async () => {
      // Given: ヘッダー行のみのデータ
      const mockSheetData = [["id", "name"]]
      mockGetSheetData.mockResolvedValue(mockSheetData)

      // When: プレイヤー一覧を取得する
      const result = await getPlayers()

      // Then: 空の配列が返される
      expect(result).toEqual([])
    })

    it("should filter out invalid data", async () => {
      // Given: 無効なデータが混在するシートデータ
      const mockSheetData = [
        ["id", "name"], // ヘッダー行
        ["1", "るぐら"], // 有効
        ["", "風龍"], // ID不正
        ["3", ""], // 名前空
        ["abc", "せせらぎ"], // ID非数値（0になる）
        ["4", "valid"], // 有効
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)

      // When: プレイヤー一覧を取得する
      const result = await getPlayers()

      // Then: 有効なデータのみが返される
      const expected: Player[] = [
        { id: 1, name: "るぐら" },
        { id: 4, name: "valid" },
      ]
      expect(result).toEqual(expected)
    })

    it("should throw error when API call fails", async () => {
      // Given: Google Sheets APIがエラーを返す
      const apiError = new Error("Sheets API Error")
      mockGetSheetData.mockRejectedValue(apiError)

      // When: プレイヤー一覧を取得する
      // Then: カスタムエラーメッセージでエラーが投げられる
      await expect(getPlayers()).rejects.toThrow(
        "プレイヤーデータの取得に失敗しました",
      )
    })
  })

  describe("getPlayerById", () => {
    it("should return player when ID exists", async () => {
      // Given: 指定IDのプレイヤーが存在する
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
        ["2", "風龍"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)

      // When: 存在するIDでプレイヤーを取得する
      const result = await getPlayerById(1)

      // Then: 正しいプレイヤーが返される
      expect(result).toEqual({ id: 1, name: "るぐら" })
    })

    it("should return null when ID does not exist", async () => {
      // Given: 指定IDのプレイヤーが存在しない
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
        ["2", "風龍"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)

      // When: 存在しないIDでプレイヤーを取得する
      const result = await getPlayerById(999)

      // Then: nullが返される
      expect(result).toBeNull()
    })

    it("should throw error when API call fails", async () => {
      // Given: Google Sheets APIがエラーを返す
      const apiError = new Error("Sheets API Error")
      mockGetSheetData.mockRejectedValue(apiError)

      // When: プレイヤーを取得する
      // Then: カスタムエラーメッセージでエラーが投げられる
      await expect(getPlayerById(1)).rejects.toThrow(
        "プレイヤーデータの取得に失敗しました",
      )
    })
  })

  describe("createPlayer", () => {
    it("should create new player with auto-generated ID", async () => {
      // Given: 既存のプレイヤーが存在する
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
        ["3", "風龍"], // ID 2 は欠番
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)
      mockAppendSheetData.mockResolvedValue({})

      const newPlayerData: CreatePlayerData = { name: "せせらぎ" }

      // When: 新しいプレイヤーを作成する
      const result = await createPlayer(newPlayerData)

      // Then: 最大ID+1で新しいプレイヤーが作成される
      expect(result).toEqual({ id: 4, name: "せせらぎ" })
      expect(mockAppendSheetData).toHaveBeenCalledWith("players", [
        [4, "せせらぎ"],
      ])
    })

    it("should create player with ID 1 when no players exist", async () => {
      // Given: プレイヤーが存在しない（ヘッダーのみ）
      const mockSheetData = [["id", "name"]]
      mockGetSheetData.mockResolvedValue(mockSheetData)
      mockAppendSheetData.mockResolvedValue({})

      const newPlayerData: CreatePlayerData = { name: "初のプレイヤー" }

      // When: 新しいプレイヤーを作成する
      const result = await createPlayer(newPlayerData)

      // Then: ID 1で新しいプレイヤーが作成される
      expect(result).toEqual({ id: 1, name: "初のプレイヤー" })
      expect(mockAppendSheetData).toHaveBeenCalledWith("players", [
        [1, "初のプレイヤー"],
      ])
    })

    it("should throw error when API call fails", async () => {
      // Given: getPlayersは成功するがappendSheetDataが失敗する
      mockGetSheetData.mockResolvedValue([["id", "name"]])
      const apiError = new Error("Sheets API Error")
      mockAppendSheetData.mockRejectedValue(apiError)

      const newPlayerData: CreatePlayerData = { name: "テストプレイヤー" }

      // When: 新しいプレイヤーを作成する
      // Then: カスタムエラーメッセージでエラーが投げられる
      await expect(createPlayer(newPlayerData)).rejects.toThrow(
        "プレイヤーの作成に失敗しました",
      )
    })
  })

  describe("updatePlayer", () => {
    it("should update existing player successfully", async () => {
      // Given: 更新対象のプレイヤーが存在する
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
        ["2", "風龍"],
        ["3", "せせらぎ"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)
      mockUpdateSheetData.mockResolvedValue({})

      const updateData: UpdatePlayerData = { id: 2, name: "更新された風龍" }

      // When: プレイヤーを更新する
      const result = await updatePlayer(updateData)

      // Then: 正しく更新される（行番号は配列インデックス+2）
      expect(result).toEqual({ id: 2, name: "更新された風龍" })
      expect(mockUpdateSheetData).toHaveBeenCalledWith("players", "A3:B3", [
        [2, "更新された風龍"],
      ])
    })

    it("should throw error when player does not exist", async () => {
      // Given: 更新対象のプレイヤーが存在しない
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
        ["2", "風龍"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)

      const updateData: UpdatePlayerData = {
        id: 999,
        name: "存在しないプレイヤー",
      }

      // When: 存在しないプレイヤーを更新する
      // Then: エラーが投げられる
      await expect(updatePlayer(updateData)).rejects.toThrow(
        "指定されたプレイヤーが見つかりません",
      )
    })

    it("should throw error when API call fails", async () => {
      // Given: getPlayersは成功するがupdateSheetDataが失敗する
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)
      const apiError = new Error("Sheets API Error")
      mockUpdateSheetData.mockRejectedValue(apiError)

      const updateData: UpdatePlayerData = { id: 1, name: "更新失敗" }

      // When: プレイヤーを更新する
      // Then: カスタムエラーメッセージでエラーが投げられる
      await expect(updatePlayer(updateData)).rejects.toThrow(
        "プレイヤーの更新に失敗しました",
      )
    })
  })

  describe("deletePlayer", () => {
    it("should delete existing player successfully", async () => {
      // Given: 削除対象のプレイヤーが存在する
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
        ["2", "風龍"],
        ["3", "せせらぎ"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)
      mockUpdateSheetData.mockResolvedValue({})

      // When: プレイヤーを削除する
      await deletePlayer(2)

      // Then: 名前フィールドが空文字で更新される（論理削除）
      expect(mockUpdateSheetData).toHaveBeenCalledWith("players", "B3", [[""]])
    })

    it("should throw error when player does not exist", async () => {
      // Given: 削除対象のプレイヤーが存在しない
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
        ["2", "風龍"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)

      // When: 存在しないプレイヤーを削除する
      // Then: エラーが投げられる
      await expect(deletePlayer(999)).rejects.toThrow(
        "指定されたプレイヤーが見つかりません",
      )
    })

    it("should throw error when API call fails", async () => {
      // Given: getPlayersは成功するがupdateSheetDataが失敗する
      const mockSheetData = [
        ["id", "name"],
        ["1", "るぐら"],
      ]
      mockGetSheetData.mockResolvedValue(mockSheetData)
      const apiError = new Error("Sheets API Error")
      mockUpdateSheetData.mockRejectedValue(apiError)

      // When: プレイヤーを削除する
      // Then: カスタムエラーメッセージでエラーが投げられる
      await expect(deletePlayer(1)).rejects.toThrow(
        "プレイヤーの削除に失敗しました",
      )
    })
  })
})
