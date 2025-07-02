import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// vitest hoisted で定義したモック
const mockSheetsAPI = vi.hoisted(() => ({
  spreadsheets: {
    values: {
      get: vi.fn(),
      append: vi.fn(),
      update: vi.fn(),
      clear: vi.fn(),
    },
    get: vi.fn(),
    batchUpdate: vi.fn(),
  },
}))

const mockAuth = vi.hoisted(() => ({
  JWT: vi.fn().mockImplementation(() => ({})),
}))

const mockGoogle = vi.hoisted(() => ({
  auth: mockAuth,
  sheets: vi.fn().mockReturnValue(mockSheetsAPI),
}))

vi.mock("googleapis", () => ({
  google: mockGoogle,
}))

// モック対象のインポート
import {
  appendSheetData,
  clearSheetRange,
  deleteSheetRow,
  getGoogleSheetsClient,
  getSheetData,
  getSpreadsheetId,
  updateSheetData,
} from "./google-sheets"

describe("Google Sheets API", () => {
  beforeEach(() => {
    // Given: 各テスト前にモックをリセット
    vi.clearAllMocks()
    vi.stubEnv("GOOGLE_SHEETS_PRIVATE_KEY", "test-private-key\\nwith-newlines")
    vi.stubEnv("GOOGLE_SHEETS_CLIENT_EMAIL", "test@example.com")
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "test-spreadsheet-id")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe("getGoogleSheetsClient", () => {
    it("should create Google Sheets client with valid credentials", () => {
      // Given: 有効な環境変数が設定されている

      // When: Google Sheets クライアントを作成する
      const client = getGoogleSheetsClient()

      // Then: クライアントが正常に作成される
      expect(mockAuth.JWT).toHaveBeenCalledWith({
        email: "test@example.com",
        key: "test-private-key\nwith-newlines", // 改行文字が正しく処理される
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      })
      expect(mockGoogle.sheets).toHaveBeenCalledWith({
        version: "v4",
        auth: {},
      })
      expect(client).toBe(mockSheetsAPI)
    })

    it("should throw error when GOOGLE_SHEETS_PRIVATE_KEY is missing", () => {
      // Given: GOOGLE_SHEETS_PRIVATE_KEY が設定されていない
      vi.stubEnv("GOOGLE_SHEETS_PRIVATE_KEY", "")

      // When: Google Sheets クライアント作成を試行する
      // Then: エラーが投げられる
      expect(() => getGoogleSheetsClient()).toThrow(
        "Google Sheets API credentials are not set in environment variables",
      )
    })

    it("should throw error when GOOGLE_SHEETS_CLIENT_EMAIL is missing", () => {
      // Given: GOOGLE_SHEETS_CLIENT_EMAIL が設定されていない
      vi.stubEnv("GOOGLE_SHEETS_CLIENT_EMAIL", "")

      // When: Google Sheets クライアント作成を試行する
      // Then: エラーが投げられる
      expect(() => getGoogleSheetsClient()).toThrow(
        "Google Sheets API credentials are not set in environment variables",
      )
    })
  })

  describe("getSpreadsheetId", () => {
    it("should return spreadsheet ID from environment variable", () => {
      // Given: GOOGLE_SHEETS_SPREADSHEET_ID が設定されている

      // When: スプレッドシートIDを取得する
      const spreadsheetId = getSpreadsheetId()

      // Then: 正しいIDが返される
      expect(spreadsheetId).toBe("test-spreadsheet-id")
    })

    it("should throw error when GOOGLE_SHEETS_SPREADSHEET_ID is missing", () => {
      // Given: GOOGLE_SHEETS_SPREADSHEET_ID が設定されていない
      vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "")

      // When: スプレッドシートID取得を試行する
      // Then: エラーが投げられる
      expect(() => getSpreadsheetId()).toThrow(
        "GOOGLE_SHEETS_SPREADSHEET_ID is not set in environment variables",
      )
    })
  })

  describe("getSheetData", () => {
    it("should fetch data from sheet successfully", async () => {
      // Given: APIが正常なレスポンスを返す
      const mockData = [
        ["id", "name"],
        ["1", "Player 1"],
        ["2", "Player 2"],
      ]
      mockSheetsAPI.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData },
      })

      // When: シートからデータを取得する
      const result = await getSheetData("players")

      // Then: 正しいデータが返される
      expect(result).toEqual(mockData)
      expect(mockSheetsAPI.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "players",
      })
    })

    it("should fetch data with specific range", async () => {
      // Given: 特定の範囲を指定してAPIが正常なレスポンスを返す
      const mockData = [["1", "Player 1"]]
      mockSheetsAPI.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData },
      })

      // When: 範囲を指定してシートからデータを取得する
      const result = await getSheetData("players", "A2:B2")

      // Then: 正しいデータが返される
      expect(result).toEqual(mockData)
      expect(mockSheetsAPI.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "players!A2:B2",
      })
    })

    it("should return empty array when no data found", async () => {
      // Given: APIが空のレスポンスを返す
      mockSheetsAPI.spreadsheets.values.get.mockResolvedValue({
        data: {},
      })

      // When: シートからデータを取得する
      const result = await getSheetData("players")

      // Then: 空の配列が返される
      expect(result).toEqual([])
    })

    it("should throw error when API call fails", async () => {
      // Given: APIがエラーを返す
      const apiError = new Error("API Error")
      mockSheetsAPI.spreadsheets.values.get.mockRejectedValue(apiError)

      // When: シートからデータを取得する
      // Then: エラーが投げられる
      await expect(getSheetData("players")).rejects.toThrow(apiError)
    })
  })

  describe("appendSheetData", () => {
    it("should append data to sheet successfully", async () => {
      // Given: APIが正常なレスポンスを返す
      const mockResponse = { data: { updates: { updatedRows: 1 } } }
      mockSheetsAPI.spreadsheets.values.append.mockResolvedValue(mockResponse)
      const dataToAppend = [["3", "New Player"]]

      // When: シートにデータを追加する
      const result = await appendSheetData("players", dataToAppend)

      // Then: 正しいレスポンスが返される
      expect(result).toEqual(mockResponse.data)
      expect(mockSheetsAPI.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "players",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: dataToAppend },
      })
    })

    it("should throw error when API call fails", async () => {
      // Given: APIがエラーを返す
      const apiError = new Error("API Error")
      mockSheetsAPI.spreadsheets.values.append.mockRejectedValue(apiError)

      // When: シートにデータを追加する
      // Then: エラーが投げられる
      await expect(appendSheetData("players", [["data"]])).rejects.toThrow(
        apiError,
      )
    })
  })

  describe("updateSheetData", () => {
    it("should update sheet data successfully", async () => {
      // Given: APIが正常なレスポンスを返す
      const mockResponse = { data: { updatedRows: 1 } }
      mockSheetsAPI.spreadsheets.values.update.mockResolvedValue(mockResponse)
      const dataToUpdate = [["1", "Updated Player"]]

      // When: シートのデータを更新する
      const result = await updateSheetData("players", "A2:B2", dataToUpdate)

      // Then: 正しいレスポンスが返される
      expect(result).toEqual(mockResponse.data)
      expect(mockSheetsAPI.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "players!A2:B2",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: dataToUpdate },
      })
    })

    it("should throw error when API call fails", async () => {
      // Given: APIがエラーを返す
      const apiError = new Error("API Error")
      mockSheetsAPI.spreadsheets.values.update.mockRejectedValue(apiError)

      // When: シートのデータを更新する
      // Then: エラーが投げられる
      await expect(
        updateSheetData("players", "A2:B2", [["data"]]),
      ).rejects.toThrow(apiError)
    })
  })

  describe("clearSheetRange", () => {
    it("should clear sheet range successfully", async () => {
      // Given: APIが正常なレスポンスを返す
      const mockResponse = { data: { clearedRange: "players!A2:B2" } }
      mockSheetsAPI.spreadsheets.values.clear.mockResolvedValue(mockResponse)

      // When: シートの範囲をクリアする
      const result = await clearSheetRange("players", "A2:B2")

      // Then: 正しいレスポンスが返される
      expect(result).toEqual(mockResponse.data)
      expect(mockSheetsAPI.spreadsheets.values.clear).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "players!A2:B2",
      })
    })

    it("should throw error when API call fails", async () => {
      // Given: APIがエラーを返す
      const apiError = new Error("API Error")
      mockSheetsAPI.spreadsheets.values.clear.mockRejectedValue(apiError)

      // When: シートの範囲をクリアする
      // Then: エラーが投げられる
      await expect(clearSheetRange("players", "A2:B2")).rejects.toThrow(
        apiError,
      )
    })
  })

  describe("deleteSheetRow", () => {
    it("should delete sheet row successfully", async () => {
      // Given: APIが正常なレスポンスを返す
      const mockSpreadsheetResponse = {
        data: {
          sheets: [
            {
              properties: {
                title: "players",
                sheetId: 123,
              },
            },
          ],
        },
      }
      const mockBatchUpdateResponse = { data: { replies: [] } }

      mockSheetsAPI.spreadsheets.get.mockResolvedValue(mockSpreadsheetResponse)
      mockSheetsAPI.spreadsheets.batchUpdate.mockResolvedValue(
        mockBatchUpdateResponse,
      )

      // When: シートの行を削除する
      const result = await deleteSheetRow("players", 1)

      // Then: 正しいAPIが呼ばれる
      expect(result).toEqual(mockBatchUpdateResponse.data)
      expect(mockSheetsAPI.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
      })
      expect(mockSheetsAPI.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 123,
                  dimension: "ROWS",
                  startIndex: 1,
                  endIndex: 2,
                },
              },
            },
          ],
        },
      })
    })

    it("should delete sheet row successfully when sheetId is 0", async () => {
      // Given: sheetIdが0のシート（最初のシート）
      const mockSpreadsheetResponse = {
        data: {
          sheets: [
            {
              properties: {
                title: "players",
                sheetId: 0, // 0は有効なsheetId
              },
            },
          ],
        },
      }
      const mockBatchUpdateResponse = { data: { replies: [] } }

      mockSheetsAPI.spreadsheets.get.mockResolvedValue(mockSpreadsheetResponse)
      mockSheetsAPI.spreadsheets.batchUpdate.mockResolvedValue(
        mockBatchUpdateResponse,
      )

      // When: シートの行を削除する
      const result = await deleteSheetRow("players", 1)

      // Then: 正しいAPIが呼ばれる（sheetId: 0でも動作する）
      expect(result).toEqual(mockBatchUpdateResponse.data)
      expect(mockSheetsAPI.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0, // sheetId: 0が正しく使用される
                  dimension: "ROWS",
                  startIndex: 1,
                  endIndex: 2,
                },
              },
            },
          ],
        },
      })
    })

    it("should throw error when sheet is not found", async () => {
      // Given: 指定されたシートが存在しない
      const mockSpreadsheetResponse = {
        data: {
          sheets: [
            {
              properties: {
                title: "other-sheet",
                sheetId: 456,
              },
            },
          ],
        },
      }

      mockSheetsAPI.spreadsheets.get.mockResolvedValue(mockSpreadsheetResponse)

      // When: 存在しないシートの行を削除する
      // Then: エラーが投げられる
      await expect(deleteSheetRow("players", 1)).rejects.toThrow(
        'Sheet "players" not found',
      )
    })

    it("should throw error when API call fails", async () => {
      // Given: APIがエラーを返す
      const apiError = new Error("API Error")
      mockSheetsAPI.spreadsheets.get.mockRejectedValue(apiError)

      // When: シートの行を削除する
      // Then: エラーが投げられる
      await expect(deleteSheetRow("players", 1)).rejects.toThrow(apiError)
    })
  })
})
