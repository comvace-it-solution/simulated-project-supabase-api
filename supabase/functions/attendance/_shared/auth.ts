import { HttpError } from "./validation.ts";

export function assertApiKey(request: Request): void {
  const requestApiKey = request.headers.get("x-api-key");
  const internalApiKey = Deno.env.get("INTERNAL_API_KEY");

  if (!requestApiKey) {
    throw new HttpError(401, "x-api-key ヘッダーは必須です。");
  }

  if (!internalApiKey) {
    throw new HttpError(
      500,
      "INTERNAL_API_KEY が設定されていません。",
    );
  }

  if (requestApiKey !== internalApiKey) {
    throw new HttpError(403, "APIキーが不正です。");
  }
}
