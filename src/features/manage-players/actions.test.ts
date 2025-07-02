import { beforeEach, describe, expect, it, vi } from "vitest"

// vitest hoisted で定義したモック
const mockCreatePlayer = vi.hoisted(() => vi.fn())
const mockDeletePlayer = vi.hoisted(() => vi.fn())
const mockUpdatePlayer = vi.hoisted(() => vi.fn())
const mockRevalidatePath = vi.hoisted(() => vi.fn())

// entities/player/api のモック
vi.mock("../../entities/player/api", () => ({
  createPlayer: mockCreatePlayer,
  deletePlayer: mockDeletePlayer,
  updatePlayer: mockUpdatePlayer,
}))

// Next.js のモック
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}))

// モック対象のインポート
import type {
  ActionResult,
  CreatePlayerState,
  UpdatePlayerState,
} from "./actions"
import {
  createPlayerAction,
  deletePlayerAction,
  updatePlayerAction,
} from "./actions"

describe("manage-players actions", () => {
  beforeEach(() => {
    // Given: 各テスト前にモックをリセット
    vi.clearAllMocks()
  })

  describe("deletePlayerAction", () => {
    describe("正常系", () => {
      it("有効なplayerIdでプレイヤー削除が成功する", async () => {
        // Given: 有効なplayerIdが渡される
        const playerId = 1
        mockDeletePlayer.mockResolvedValue(undefined)

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: 成功レスポンスが返される
        const expected: ActionResult = {
          success: true,
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).toHaveBeenCalledWith(playerId)
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players")
      })
    })

    describe("入力バリデーションエラー系", () => {
      it("playerIdが0の場合、バリデーションエラーが返される", async () => {
        // Given: playerIdが0
        const playerId = 0

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: バリデーションエラーが返される
        const expected: ActionResult = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("playerIdが負の数の場合、バリデーションエラーが返される", async () => {
        // Given: playerIdが負の数
        const playerId = -1

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: バリデーションエラーが返される
        const expected: ActionResult = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("playerIdがnullの場合、バリデーションエラーが返される", async () => {
        // Given: playerIdがnull
        const playerId = null as unknown as number

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: バリデーションエラーが返される
        const expected: ActionResult = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("playerIdがundefinedの場合、バリデーションエラーが返される", async () => {
        // Given: playerIdがundefined
        const playerId = undefined as unknown as number

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: バリデーションエラーが返される
        const expected: ActionResult = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("playerIdが文字列の場合、バリデーションエラーが返される", async () => {
        // Given: playerIdが文字列
        const playerId = "1" as unknown as number

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: バリデーションエラーが返される
        const expected: ActionResult = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })
    })

    describe("ビジネスロジックエラー系", () => {
      it("指定されたプレイヤーが見つからない場合、特定のエラーメッセージが返される", async () => {
        // Given: プレイヤーが見つからないエラーが発生
        const playerId = 999
        const error = new Error("指定されたプレイヤーが見つかりません")
        mockDeletePlayer.mockRejectedValue(error)

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: 特定のエラーメッセージが返される
        const expected: ActionResult = {
          success: false,
          error: "指定されたプレイヤーが見つかりません",
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).toHaveBeenCalledWith(playerId)
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("その他のAPIエラーが発生した場合、汎用エラーメッセージが返される", async () => {
        // Given: その他のAPIエラーが発生
        const playerId = 1
        const error = new Error("Database connection failed")
        mockDeletePlayer.mockRejectedValue(error)

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: 汎用エラーメッセージが返される
        const expected: ActionResult = {
          success: false,
          error: "プレイヤーの削除に失敗しました",
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).toHaveBeenCalledWith(playerId)
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("Error以外の例外が発生した場合、汎用エラーメッセージが返される", async () => {
        // Given: Error以外の例外が発生
        const playerId = 1
        const error = "String error"
        mockDeletePlayer.mockRejectedValue(error)

        // When: プレイヤー削除を実行する
        const result = await deletePlayerAction(playerId)

        // Then: 汎用エラーメッセージが返される
        const expected: ActionResult = {
          success: false,
          error: "プレイヤーの削除に失敗しました",
        }
        expect(result).toEqual(expected)
        expect(mockDeletePlayer).toHaveBeenCalledWith(playerId)
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })
    })
  })

  describe("createPlayerAction", () => {
    // FormData作成ヘルパー関数
    const createFormData = (fields: Record<string, string>) => {
      const formData = new FormData()
      for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value)
      }
      return formData
    }

    describe("正常系", () => {
      it("有効な名前でプレイヤー作成が成功する", async () => {
        // Given: 有効なプレイヤー名のFormDataが渡される
        const formData = createFormData({ name: "テストプレイヤー" })
        mockCreatePlayer.mockResolvedValue({ id: 1, name: "テストプレイヤー" })

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: 成功レスポンスが返される
        expect(result).toEqual({
          success: true,
        })
        expect(mockCreatePlayer).toHaveBeenCalledWith({
          name: "テストプレイヤー",
        })
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players")
      })
    })

    describe("入力バリデーションエラー系", () => {
      it("nameが空文字列の場合、バリデーションエラーが返される", async () => {
        // Given: nameが空文字列のFormData
        const formData = createFormData({ name: "" })

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: CreatePlayerState = {
          success: false,
          error: "プレイヤー名を入力してください",
        }
        expect(result).toEqual(expected)
        expect(mockCreatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("nameが空白のみの場合、バリデーションエラーが返される", async () => {
        // Given: nameが空白のみのFormData
        const formData = createFormData({ name: "   " })

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: CreatePlayerState = {
          success: false,
          error: "プレイヤー名を入力してください",
        }
        expect(result).toEqual(expected)
        expect(mockCreatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("nameが51文字以上の場合、バリデーションエラーが返される", async () => {
        // Given: nameが51文字以上のFormData
        const longName = "あ".repeat(51)
        const formData = createFormData({ name: longName })

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: CreatePlayerState = {
          success: false,
          error: "プレイヤー名は50文字以内で入力してください",
        }
        expect(result).toEqual(expected)
        expect(mockCreatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("nameフィールドが存在しない場合、バリデーションエラーが返される", async () => {
        // Given: nameフィールドが存在しないFormData
        const formData = new FormData()

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: CreatePlayerState = {
          success: false,
          error: "プレイヤー名を入力してください",
        }
        expect(result).toEqual(expected)
        expect(mockCreatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })
    })

    describe("エッジケース", () => {
      it("nameの前後に空白がある場合、trimされて処理される", async () => {
        // Given: nameの前後に空白があるFormData
        const formData = createFormData({ name: "  テストプレイヤー  " })
        mockCreatePlayer.mockResolvedValue({ id: 1, name: "テストプレイヤー" })

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: 成功レスポンスが返される
        expect(result).toEqual({
          success: true,
        })
        expect(mockCreatePlayer).toHaveBeenCalledWith({
          name: "テストプレイヤー",
        })
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players")
      })

      it("nameが50文字ちょうどの場合、正常に処理される", async () => {
        // Given: nameが50文字ちょうどのFormData
        const exactName = "あ".repeat(50)
        const formData = createFormData({ name: exactName })
        mockCreatePlayer.mockResolvedValue({ id: 1, name: exactName })

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: 成功レスポンスが返される
        expect(result).toEqual({
          success: true,
        })
        expect(mockCreatePlayer).toHaveBeenCalledWith({ name: exactName })
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players")
      })

      it("特殊文字を含む名前でも正常に処理される", async () => {
        // Given: 特殊文字を含む名前のFormData
        const specialName = "テスト@プレイヤー_2024-01-01"
        const formData = createFormData({ name: specialName })
        mockCreatePlayer.mockResolvedValue({ id: 1, name: specialName })

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: 成功レスポンスが返される
        expect(result).toEqual({
          success: true,
        })
        expect(mockCreatePlayer).toHaveBeenCalledWith({ name: specialName })
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players")
      })
    })

    describe("インフラストラクチャエラー系", () => {
      it("createPlayer APIでエラーが発生した場合、エラーメッセージが返される", async () => {
        // Given: createPlayer APIでエラーが発生
        const formData = createFormData({ name: "テストプレイヤー" })
        const error = new Error("Database connection failed")
        mockCreatePlayer.mockRejectedValue(error)

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: エラーメッセージが返される
        const expected: CreatePlayerState = {
          success: false,
          error: "Database connection failed",
        }
        expect(result).toEqual(expected)
        expect(mockCreatePlayer).toHaveBeenCalledWith({
          name: "テストプレイヤー",
        })
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("Error以外の例外が発生した場合、汎用エラーメッセージが返される", async () => {
        // Given: Error以外の例外が発生
        const formData = createFormData({ name: "テストプレイヤー" })
        const error = "String error"
        mockCreatePlayer.mockRejectedValue(error)

        // When: プレイヤー作成を実行する
        const result = await createPlayerAction(null, formData)

        // Then: 汎用エラーメッセージが返される
        const expected: CreatePlayerState = {
          success: false,
          error: "プレイヤーの作成に失敗しました",
        }
        expect(result).toEqual(expected)
        expect(mockCreatePlayer).toHaveBeenCalledWith({
          name: "テストプレイヤー",
        })
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })
    })
  })

  describe("updatePlayerAction", () => {
    // FormData作成ヘルパー関数（再利用）
    const createFormData = (fields: Record<string, string>) => {
      const formData = new FormData()
      for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value)
      }
      return formData
    }

    describe("正常系", () => {
      it("有効なidと名前でプレイヤー更新が成功し、リダイレクトが呼ばれる", async () => {
        // Given: 有効なidとプレイヤー名のFormDataが渡される
        const formData = createFormData({
          id: "1",
          name: "更新されたプレイヤー",
        })
        mockUpdatePlayer.mockResolvedValue({
          id: 1,
          name: "更新されたプレイヤー",
        })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: 成功レスポンスが返される
        expect(result).toEqual({
          success: true,
        })
        expect(mockUpdatePlayer).toHaveBeenCalledWith({
          id: 1,
          name: "更新されたプレイヤー",
        })
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players")
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players/1/edit")
      })
    })

    describe("入力バリデーションエラー系", () => {
      it("idが0の場合、バリデーションエラーが返される", async () => {
        // Given: idが0のFormData
        const formData = createFormData({ id: "0", name: "テストプレイヤー" })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("idが負の数の場合、バリデーションエラーが返される", async () => {
        // Given: idが負の数のFormData
        const formData = createFormData({ id: "-1", name: "テストプレイヤー" })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("idが文字列の場合、バリデーションエラーが返される", async () => {
        // Given: idが数値に変換できない文字列のFormData
        const formData = createFormData({ id: "abc", name: "テストプレイヤー" })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("idフィールドが存在しない場合、バリデーションエラーが返される", async () => {
        // Given: idフィールドが存在しないFormData
        const formData = createFormData({ name: "テストプレイヤー" })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "無効なプレイヤーIDです",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("nameが空文字列の場合、バリデーションエラーが返される", async () => {
        // Given: nameが空文字列のFormData
        const formData = createFormData({ id: "1", name: "" })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "プレイヤー名を入力してください",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("nameが空白のみの場合、バリデーションエラーが返される", async () => {
        // Given: nameが空白のみのFormData
        const formData = createFormData({ id: "1", name: "   " })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "プレイヤー名を入力してください",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("nameが51文字以上の場合、バリデーションエラーが返される", async () => {
        // Given: nameが51文字以上のFormData
        const longName = "あ".repeat(51)
        const formData = createFormData({ id: "1", name: longName })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "プレイヤー名は50文字以内で入力してください",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("nameフィールドが存在しない場合、バリデーションエラーが返される", async () => {
        // Given: nameフィールドが存在しないFormData
        const formData = createFormData({ id: "1" })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: バリデーションエラーが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "プレイヤー名を入力してください",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).not.toHaveBeenCalled()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })
    })

    describe("エッジケース", () => {
      it("nameの前後に空白がある場合、trimされて処理される", async () => {
        // Given: nameの前後に空白があるFormData
        const formData = createFormData({
          id: "1",
          name: "  更新されたプレイヤー  ",
        })
        mockUpdatePlayer.mockResolvedValue({
          id: 1,
          name: "更新されたプレイヤー",
        })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: 成功レスポンスが返される
        expect(result).toEqual({
          success: true,
        })
        expect(mockUpdatePlayer).toHaveBeenCalledWith({
          id: 1,
          name: "更新されたプレイヤー",
        })
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players")
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players/1/edit")
      })

      it("nameが50文字ちょうどの場合、正常に処理される", async () => {
        // Given: nameが50文字ちょうどのFormData
        const exactName = "あ".repeat(50)
        const formData = createFormData({ id: "1", name: exactName })
        mockUpdatePlayer.mockResolvedValue({ id: 1, name: exactName })

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: 成功レスポンスが返される
        expect(result).toEqual({
          success: true,
        })
        expect(mockUpdatePlayer).toHaveBeenCalledWith({
          id: 1,
          name: exactName,
        })
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players")
        expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/players/1/edit")
      })
    })

    describe("ビジネスロジックエラー系", () => {
      it("指定されたプレイヤーが見つからない場合、特定のエラーメッセージが返される", async () => {
        // Given: プレイヤーが見つからないエラーが発生
        const formData = createFormData({ id: "999", name: "テストプレイヤー" })
        const error = new Error("指定されたプレイヤーが見つかりません")
        mockUpdatePlayer.mockRejectedValue(error)

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: 特定のエラーメッセージが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "指定されたプレイヤーが見つかりません",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).toHaveBeenCalledWith({
          id: 999,
          name: "テストプレイヤー",
        })
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("その他のAPIエラーが発生した場合、エラーメッセージが返される", async () => {
        // Given: その他のAPIエラーが発生
        const formData = createFormData({ id: "1", name: "テストプレイヤー" })
        const error = new Error("Database connection failed")
        mockUpdatePlayer.mockRejectedValue(error)

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: エラーメッセージが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "Database connection failed",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).toHaveBeenCalledWith({
          id: 1,
          name: "テストプレイヤー",
        })
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })

      it("Error以外の例外が発生した場合、汎用エラーメッセージが返される", async () => {
        // Given: Error以外の例外が発生
        const formData = createFormData({ id: "1", name: "テストプレイヤー" })
        const error = "String error"
        mockUpdatePlayer.mockRejectedValue(error)

        // When: プレイヤー更新を実行する
        const result = await updatePlayerAction(null, formData)

        // Then: 汎用エラーメッセージが返される
        const expected: UpdatePlayerState = {
          success: false,
          error: "プレイヤーの更新に失敗しました",
        }
        expect(result).toEqual(expected)
        expect(mockUpdatePlayer).toHaveBeenCalledWith({
          id: 1,
          name: "テストプレイヤー",
        })
        expect(mockRevalidatePath).not.toHaveBeenCalled()
      })
    })
  })

  describe("コンソールログの確認", () => {
    it("deletePlayerActionでエラー発生時にコンソールにエラーログが出力される", async () => {
      // Given: コンソールエラーをモック化し、deletePlayerがエラーをthrow
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const playerId = 1
      const error = new Error("Test error")
      mockDeletePlayer.mockRejectedValue(error)

      // When: プレイヤー削除を実行する
      await deletePlayerAction(playerId)

      // Then: コンソールにエラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in deletePlayerAction:",
        error,
      )

      // Cleanup
      consoleSpy.mockRestore()
    })

    it("createPlayerActionでエラー発生時にコンソールにエラーログが出力される", async () => {
      // Given: コンソールエラーをモック化し、createPlayerがエラーをthrow
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const formData = new FormData()
      formData.append("name", "テストプレイヤー")
      const error = new Error("Test error")
      mockCreatePlayer.mockRejectedValue(error)

      // When: プレイヤー作成を実行する
      await createPlayerAction(null, formData)

      // Then: コンソールにエラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in createPlayerAction:",
        error,
      )

      // Cleanup
      consoleSpy.mockRestore()
    })

    it("updatePlayerActionでエラー発生時にコンソールにエラーログが出力される", async () => {
      // Given: コンソールエラーをモック化し、updatePlayerがエラーをthrow
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const formData = new FormData()
      formData.append("id", "1")
      formData.append("name", "テストプレイヤー")
      const error = new Error("Test error")
      mockUpdatePlayer.mockRejectedValue(error)

      // When: プレイヤー更新を実行する
      await updatePlayerAction(null, formData)

      // Then: コンソールにエラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in updatePlayerAction:",
        error,
      )

      // Cleanup
      consoleSpy.mockRestore()
    })
  })
})
