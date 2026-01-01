import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";

describe("proxy", () => {
  beforeEach(() => {
    // Given: 各テスト前に環境変数とモックをリセット
    vi.clearAllMocks();
    vi.stubEnv("ADMIN_USER", "testuser");
    vi.stubEnv("ADMIN_PASSWORD", "testpass");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("/admin パスでのBasic認証", () => {
    it("認証ヘッダーがない場合、401エラーを返す", async () => {
      // Given: /adminパスへのリクエストで認証ヘッダーなし
      const request = new NextRequest("http://localhost:3000/admin");

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 401エラーと適切なヘッダーが返される
      expect(response.status).toBe(401);
      expect(response.headers.get("WWW-Authenticate")).toBe(
        'Basic realm="Admin Area"'
      );
      expect(await response.text()).toBe("認証が必要です");
    });

    it("正しい認証情報の場合、処理を続行する", async () => {
      // Given: 正しいBasic認証ヘッダー付きリクエスト
      const credentials = btoa("testuser:testpass");
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          authorization: `Basic ${credentials}`,
        },
      });

      // When: proxyを実行する
      const response = proxy(request);

      // Then: NextResponse.next()が呼ばれる（処理続行）
      expect(response).toBeDefined();
    });

    it("不正なユーザー名の場合、401エラーを返す", async () => {
      // Given: 不正なユーザー名のBasic認証ヘッダー
      const credentials = btoa("wronguser:testpass");
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          authorization: `Basic ${credentials}`,
        },
      });

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 401エラーが返される
      expect(response.status).toBe(401);
      expect(response.headers.get("WWW-Authenticate")).toBe(
        'Basic realm="Admin Area"'
      );
      expect(await response.text()).toBe("認証失敗");
    });

    it("不正なパスワードの場合、401エラーを返す", async () => {
      // Given: 不正なパスワードのBasic認証ヘッダー
      const credentials = btoa("testuser:wrongpass");
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          authorization: `Basic ${credentials}`,
        },
      });

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 401エラーが返される
      expect(response.status).toBe(401);
      expect(await response.text()).toBe("認証失敗");
    });

    it("認証ヘッダーの形式が不正な場合、401エラーを返す", async () => {
      // Given: 不正な形式の認証ヘッダー（Basicではない）
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          authorization: "Bearer token123",
        },
      });

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 401エラーが返される（Bearer tokenはBasic認証でない）
      expect(response.status).toBe(401);
      expect(await response.text()).toBe("認証失敗");
    });

    it("base64デコードに失敗した場合、401エラーを返す", async () => {
      // Given: 無効なbase64エンコードの認証ヘッダー
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          authorization: "Basic invalid-base64",
        },
      });

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 401エラーが返される
      expect(response.status).toBe(401);
      expect(await response.text()).toBe("認証情報が不正です");
    });

    it("環境変数が設定されていない場合、500エラーを返す", async () => {
      // Given: 環境変数が未設定
      vi.stubEnv("ADMIN_USER", "");
      vi.stubEnv("ADMIN_PASSWORD", "");
      const credentials = btoa("testuser:testpass");
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          authorization: `Basic ${credentials}`,
        },
      });

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 500エラーが返される
      expect(response.status).toBe(500);
      expect(await response.text()).toBe("サーバー設定エラー");
    });

    it("/admin/playersパスでも認証が要求される", async () => {
      // Given: /admin/playersパスへのリクエスト
      const request = new NextRequest("http://localhost:3000/admin/players");

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 401エラーが返される
      expect(response.status).toBe(401);
      expect(await response.text()).toBe("認証が必要です");
    });

    it("/admin/videosパスでも認証が要求される", async () => {
      // Given: /admin/videosパスへのリクエスト
      const request = new NextRequest("http://localhost:3000/admin/videos");

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 401エラーが返される
      expect(response.status).toBe(401);
      expect(await response.text()).toBe("認証が必要です");
    });
  });

  describe("非/adminパスでの動作", () => {
    it("ホームページ（/）では認証を要求しない", async () => {
      // Given: ホームページへのリクエスト
      const request = new NextRequest("http://localhost:3000/");

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 認証チェックなしで処理が続行される
      expect(response).toBeDefined();
    });

    it("プレイヤー詳細ページ（/players/1）では認証を要求しない", async () => {
      // Given: プレイヤー詳細ページへのリクエスト
      const request = new NextRequest("http://localhost:3000/players/1");

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 認証チェックなしで処理が続行される
      expect(response).toBeDefined();
    });

    it("APIルート（/api/*）では認証を要求しない", async () => {
      // Given: APIルートへのリクエスト
      const request = new NextRequest("http://localhost:3000/api/players");

      // When: proxyを実行する
      const response = proxy(request);

      // Then: 認証チェックなしで処理が続行される
      expect(response).toBeDefined();
    });
  });

  describe("エラーハンドリング", () => {
    it("コンソールエラーログが環境変数未設定時に出力される", async () => {
      // Given: コンソールエラーをモック化
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.stubEnv("ADMIN_USER", "");
      const credentials = btoa("test:test");
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          authorization: `Basic ${credentials}`,
        },
      });

      // When: proxyを実行する
      await proxy(request);

      // Then: エラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        "ADMIN_USER or ADMIN_PASSWORD environment variables are not set"
      );

      // Cleanup
      consoleSpy.mockRestore();
    });

    it("コンソールエラーログが認証情報パースエラー時に出力される", async () => {
      // Given: コンソールエラーをモック化
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          authorization: "Basic invalid-base64",
        },
      });

      // When: proxyを実行する
      await proxy(request);

      // Then: エラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        "Basic auth parsing error:",
        expect.any(Error)
      );

      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});
