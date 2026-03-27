# APIエラー仕様書

## 概要

このドキュメントは、Supabase Edge Functions で提供する勤怠管理 API のエラーハンドリングだけをまとめたものです。

対象 API は以下です。

- `POST /auth/login`
- `GET /users`
- `GET /users/{userId}`
- `POST /attendance/start`
- `POST /attendance/break/start`
- `POST /attendance/break/end`
- `POST /attendance/end`
- `GET /attendance/records?userId=1&targetMonth=2026-03`

## 共通仕様

### 共通エラーレスポンス形式

全 API のエラー時レスポンスは以下の JSON 形式です。

```json
{
  "result": "error",
  "message": "エラー内容"
}
```

### レスポンス項目

| 項目 | 型 | 説明 |
| --- | --- | --- |
| `result` | string | 固定で `error` |
| `message` | string | エラー内容 |

### HTTPステータスコード方針

| ステータス | 用途 |
| --- | --- |
| `400` | 入力不正、必須不足、形式不正 |
| `401` | APIキー未指定、認証失敗 |
| `403` | APIキー不一致 |
| `404` | 対象エンドポイントなし、対象データなし |
| `405` | 許可されていないHTTPメソッド |
| `409` | 業務ルール違反、状態不整合 |
| `500` | サーバー内部エラー、設定不備、DB操作失敗 |

## 共通エラーハンドリング

### 全 API 共通

| ステータス | 条件 | message | 備考 |
| --- | --- | --- | --- |
| `401` | `x-api-key` ヘッダー未指定 | `x-api-key ヘッダーは必須です。` | 全 API 共通 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 全 API 共通 |
| `403` | `x-api-key` 不一致 | `APIキーが不正です。` | 全 API 共通 |
| `405` | HTTPメソッド不正 | `許可されていないHTTPメソッドです。` | 各 API の許可メソッド以外 |
| `404` | ルーティング対象外のパス | `対象のエンドポイントが存在しません。` | function 単位のルーティングで返却 |

### POST API 共通

| ステータス | 条件 | message | 備考 |
| --- | --- | --- | --- |
| `400` | `Content-Type` が `application/json` ではない | `Content-Type は application/json を指定してください。` | `POST /auth/login` と勤怠系 POST API 共通 |
| `400` | JSONボディのパースに失敗 | `リクエストボディが不正です。` | `POST /auth/login` と勤怠系 POST API 共通 |

### 内部エラー共通

| ステータス | 条件 | message |
| --- | --- | --- |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |

## API別エラーハンドリング

## 1. `POST /auth/login`

### エラー一覧

| ステータス | 条件 | message | レスポンス内容 |
| --- | --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` | 共通エラー形式 |
| `400` | JSON不正 | `リクエストボディが不正です。` | 共通エラー形式 |
| `400` | `email` 未入力 | `email は必須です。` | 共通エラー形式 |
| `400` | `password` 未入力 | `password は必須です。` | 共通エラー形式 |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | 共通エラー形式 |
| `401` | ユーザー未存在 | `email または password が一致しません。` | 共通エラー形式 |
| `401` | パスワード不一致 | `email または password が一致しません。` | 共通エラー形式 |
| `403` | APIキー不正 | `APIキーが不正です。` | 共通エラー形式 |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` | 共通エラー形式 |
| `409` | `auth` レコード未作成 | `auth が作成されていません。` | 共通エラー形式 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `auth` 検索失敗 | `auth の検索に失敗しました: ...` | 共通エラー形式 |

## 2. `GET /users`

### エラー一覧

| ステータス | 条件 | message | レスポンス内容 |
| --- | --- | --- | --- |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | 共通エラー形式 |
| `403` | APIキー不正 | `APIキーが不正です。` | 共通エラー形式 |
| `405` | GET 以外のメソッド | `許可されていないHTTPメソッドです。` | 共通エラー形式 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `users` 一覧の検索失敗 | `users 一覧の検索に失敗しました: ...` | 共通エラー形式 |

## 3. `GET /users/{userId}`

### エラー一覧

| ステータス | 条件 | message | レスポンス内容 |
| --- | --- | --- | --- |
| `400` | `userId` が正の整数でない | `userId が不正です。` | 共通エラー形式 |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | 共通エラー形式 |
| `403` | APIキー不正 | `APIキーが不正です。` | 共通エラー形式 |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` | 共通エラー形式 |
| `405` | GET 以外のメソッド | `許可されていないHTTPメソッドです。` | 共通エラー形式 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` | 共通エラー形式 |

## 4. `POST /attendance/start`

### エラー一覧

| ステータス | 条件 | message | レスポンス内容 |
| --- | --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` | 共通エラー形式 |
| `400` | JSON不正 | `リクエストボディが不正です。` | 共通エラー形式 |
| `400` | `userId` 未指定 | `userId は必須です。` | 共通エラー形式 |
| `400` | `userId` が正の整数でない | `userId が不正です。` | 共通エラー形式 |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | 共通エラー形式 |
| `403` | APIキー不正 | `APIキーが不正です。` | 共通エラー形式 |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` | 共通エラー形式 |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` | 共通エラー形式 |
| `409` | すでに勤務中 | `すでに勤務中です。` | 共通エラー形式 |
| `409` | すでに休憩中 | `すでに休憩中です。` | 共通エラー形式 |
| `409` | 進行中勤務が存在 | `進行中勤務がすでに存在します。` | 共通エラー形式 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance` 作成失敗 | `attendance の作成に失敗しました: ...` | 共通エラー形式 |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` | 共通エラー形式 |

## 5. `POST /attendance/break/start`

### エラー一覧

| ステータス | 条件 | message | レスポンス内容 |
| --- | --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` | 共通エラー形式 |
| `400` | JSON不正 | `リクエストボディが不正です。` | 共通エラー形式 |
| `400` | `userId` 未指定 | `userId は必須です。` | 共通エラー形式 |
| `400` | `userId` が正の整数でない | `userId が不正です。` | 共通エラー形式 |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | 共通エラー形式 |
| `403` | APIキー不正 | `APIキーが不正です。` | 共通エラー形式 |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` | 共通エラー形式 |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` | 共通エラー形式 |
| `409` | 非勤務中 | `非勤務中のため休憩開始できません。` | 共通エラー形式 |
| `409` | すでに休憩中 | `すでに休憩中です。` | 共通エラー形式 |
| `409` | `current_attendance_id` 未設定 | `current_attendance_id が設定されていません。` | 共通エラー形式 |
| `409` | 勤務レコード不整合 | `勤務レコードが不整合です。` | 共通エラー形式 |
| `409` | 未終了の休憩あり | `未終了の休憩が存在します。` | 共通エラー形式 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance_breaks` 検索失敗 | `attendance_breaks の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance_breaks` 作成失敗 | `attendance_breaks の作成に失敗しました: ...` | 共通エラー形式 |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` | 共通エラー形式 |

## 6. `POST /attendance/break/end`

### エラー一覧

| ステータス | 条件 | message | レスポンス内容 |
| --- | --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` | 共通エラー形式 |
| `400` | JSON不正 | `リクエストボディが不正です。` | 共通エラー形式 |
| `400` | `userId` 未指定 | `userId は必須です。` | 共通エラー形式 |
| `400` | `userId` が正の整数でない | `userId が不正です。` | 共通エラー形式 |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | 共通エラー形式 |
| `403` | APIキー不正 | `APIキーが不正です。` | 共通エラー形式 |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` | 共通エラー形式 |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` | 共通エラー形式 |
| `409` | 休憩中ではない | `休憩中ではありません。` | 共通エラー形式 |
| `409` | `current_attendance_id` 未設定 | `current_attendance_id が設定されていません。` | 共通エラー形式 |
| `409` | 未終了の休憩なし | `未終了の休憩が存在しません。` | 共通エラー形式 |
| `409` | 未終了の休憩が複数存在 | `未終了の休憩が複数存在します。` | 共通エラー形式 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance_breaks` 検索失敗 | `attendance_breaks の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance_breaks` 更新失敗 | `attendance_breaks の更新に失敗しました: ...` | 共通エラー形式 |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` | 共通エラー形式 |

## 7. `POST /attendance/end`

### エラー一覧

| ステータス | 条件 | message | レスポンス内容 |
| --- | --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` | 共通エラー形式 |
| `400` | JSON不正 | `リクエストボディが不正です。` | 共通エラー形式 |
| `400` | `userId` 未指定 | `userId は必須です。` | 共通エラー形式 |
| `400` | `userId` が正の整数でない | `userId が不正です。` | 共通エラー形式 |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | 共通エラー形式 |
| `403` | APIキー不正 | `APIキーが不正です。` | 共通エラー形式 |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` | 共通エラー形式 |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` | 共通エラー形式 |
| `409` | 勤務中ではない | `勤務中ではありません。` | 共通エラー形式 |
| `409` | 休憩中のため勤務終了不可 | `休憩中のため勤務終了できません。` | 共通エラー形式 |
| `409` | `current_attendance_id` 未設定 | `current_attendance_id が設定されていません。` | 共通エラー形式 |
| `409` | 勤務レコード不整合 | `勤務レコードが不整合です。` | 共通エラー形式 |
| `409` | 未終了の休憩あり | `未終了の休憩が存在します。` | 共通エラー形式 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance_breaks` 検索失敗 | `attendance_breaks の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance` 更新失敗 | `attendance の更新に失敗しました: ...` | 共通エラー形式 |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` | 共通エラー形式 |

## 8. `GET /attendance/records`

### エラー一覧

| ステータス | 条件 | message | レスポンス内容 |
| --- | --- | --- | --- |
| `400` | `userId` クエリ未指定 | `userId は必須です。` | 共通エラー形式 |
| `400` | `targetMonth` クエリ未指定 | `targetMonth は必須です。` | 共通エラー形式 |
| `400` | `userId` が正の整数でない | `userId が不正です。` | 共通エラー形式 |
| `400` | `targetMonth` 形式不正 | `targetMonth の形式が不正です。` | 共通エラー形式 |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | 共通エラー形式 |
| `403` | APIキー不正 | `APIキーが不正です。` | 共通エラー形式 |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` | 共通エラー形式 |
| `405` | GET 以外のメソッド | `許可されていないHTTPメソッドです。` | 共通エラー形式 |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | 共通エラー形式 |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | 共通エラー形式 |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` | 共通エラー形式 |
| `500` | `attendance_breaks` 検索失敗 | `attendance_breaks の検索に失敗しました: ...` | 共通エラー形式 |

## 補足

- `OPTIONS` リクエストはエラーではなく `200` で `"ok"` を返します。
- `500` の一部は内部例外メッセージをそのまま返すため、テーブル名や設定キー名がレスポンスに含まれます。
