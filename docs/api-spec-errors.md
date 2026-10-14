# APIエラー仕様書

## 概要

このドキュメントは、Supabase Edge Functions で提供する勤怠管理 API のエラーハンドリングだけをまとめたものです。

対象 API は以下です。

- `POST /auth/login`
- `GET /users`
- `GET /users/{userId}`
- `POST /users`
- `PUT /users/{userId}`
- `DELETE /users/{userId}`
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

| 項目 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `result` | string | 必須 | 固定で `error` |
| `message` | string | 必須 | エラー内容。下表の `message` 列の値がそのまま入る |

成功時にある `data` は、エラー時には含まれません。

### レスポンスヘッダー

| ヘッダー | 値 |
| --- | --- |
| `Content-Type` | `application/json; charset=utf-8` |
| `Access-Control-Allow-Origin` | `*` |
| `Access-Control-Allow-Headers` | `authorization, x-client-info, apikey, content-type, x-api-key` |
| `Access-Control-Allow-Methods` | `auth` と `attendance` は `GET, POST, OPTIONS`、`users` は `GET, POST, PUT, DELETE, OPTIONS` |

### 本ドキュメントの読み方

以降の表は「HTTP ステータス」と「そのとき `message` に入る文字列」の対応表です。  
たとえば `POST /attendance/start` に勤務中のユーザーで再度リクエストすると、`409` と次のボディが返ります。

```json
{
  "result": "error",
  "message": "すでに勤務中です。"
}
```

読むときは次の 3 点に注意してください。

- `message` は 1 リクエストに 1 件だけです。複数のエラーをまとめた `errors` 配列は返しません
- 検証は上から順に行い、最初に失敗した時点で応答します。複数項目が不正でも返るのは 1 件です
- どの項目が原因かを示すフィールドはありません。項目名は `message` の文章に含まれます

`OPTIONS` リクエストはエラー扱いにならず、`200` で本文 `ok` のプレーンテキストを返します。

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

### POST / PUT API 共通

| ステータス | 条件 | message | 備考 |
| --- | --- | --- | --- |
| `400` | `Content-Type` が `application/json` ではない | `Content-Type は application/json を指定してください。` | ボディを受け取る全 API 共通 |
| `400` | JSONボディのパースに失敗 | `リクエストボディが不正です。` | ボディを受け取る全 API 共通 |
| `400` | 許可されていない body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` | ボディを受け取る全 API 共通 |

`DELETE /users/{userId}` はボディを受け取らないため、上記 3 件は発生しません。

### 内部エラー共通

| ステータス | 条件 | message |
| --- | --- | --- |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |

## API別エラーハンドリング

## 1. `POST /auth/login`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` |
| `400` | JSON不正 | `リクエストボディが不正です。` |
| `400` | 未定義の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` |
| `400` | `email` 未入力 | `email は必須です。` |
| `400` | `password` 未入力 | `password は必須です。` |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `401` | ユーザー未存在 | `email または password が一致しません。` |
| `401` | パスワード不一致 | `email または password が一致しません。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `409` | `auth` レコード未作成 | `auth が作成されていません。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` |
| `500` | `auth` 検索失敗 | `auth の検索に失敗しました: ...` |

## 2. `GET /users`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `405` | GET 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 一覧の検索失敗 | `users 一覧の検索に失敗しました: ...` |

## 3. `GET /users/{userId}`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `400` | `userId` が正の整数でない | `userId が不正です。` |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` |
| `405` | GET 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` |

## 4. `POST /users`

### エラー一覧

| ステータス | 条件 | message | 備考 |
| --- | --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` | - |
| `400` | JSON不正 | `リクエストボディが不正です。` | - |
| `400` | 未定義の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` | - |
| `400` | `userName` 未入力 | `userName は必須です。` | - |
| `400` | `password` 未入力 | `password は必須です。` | - |
| `400` | `password` 形式不正 | `password は半角英数字6文字で入力してください。` | - |
| `400` | `email` 未入力 | `email は必須です。` | - |
| `400` | `email` 形式不正 | `email が不正です。` | - |
| `400` | `phoneNumber` 未入力 | `phoneNumber は必須です。` | - |
| `400` | `phoneNumber` が数字11桁でない | `phoneNumber が不正です。` | - |
| `400` | `postalCode` 未入力 | `postalCode は必須です。` | - |
| `400` | `postalCode` が数字7桁でない | `postalCode が不正です。` | - |
| `400` | `prefecture` 未入力 | `prefecture は必須です。` | - |
| `400` | `streetAddress` 未入力 | `streetAddress は必須です。` | - |
| `400` | `birthDate` 未入力 | `birthDate は必須です。` | - |
| `400` | `birthDate` 形式不正、または実在しない日付 | `birthDate が不正です。` | - |
| `400` | `assignmentDate` 未入力 | `assignmentDate は必須です。` | - |
| `400` | `assignmentDate` 形式不正、または実在しない日付 | `assignmentDate が不正です。` | - |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | - |
| `403` | APIキー不正 | `APIキーが不正です。` | - |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` | - |
| `409` | `email` 重複 | `email はすでに登録されています。` | - |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | - |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | - |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | - |
| `500` | `users` 作成失敗 | `users の作成に失敗しました: ...` | - |
| `500` | `auth` 作成失敗 | `auth の作成に失敗しました: ...` | 作成済みの `users` を削除した上で返却 |

### 補足

`email` 重複は DB の `uq_users_email` 違反（SQLSTATE `23505`）を検知して `409` に変換しています。

## 5. `PUT /users/{userId}`

### エラー一覧

| ステータス | 条件 | message | 備考 |
| --- | --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` | - |
| `400` | `userId` が正の整数でない | `userId が不正です。` | - |
| `400` | JSON不正 | `リクエストボディが不正です。` | - |
| `400` | 未定義の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` | - |
| `400` | `userName` 未入力 | `userName は必須です。` | - |
| `400` | `password` 形式不正 | `password は半角英数字6文字で入力してください。` | 入力がある場合のみ検証 |
| `400` | `email` 未入力 | `email は必須です。` | - |
| `400` | `email` 形式不正 | `email が不正です。` | - |
| `400` | `phoneNumber` 未入力 | `phoneNumber は必須です。` | - |
| `400` | `phoneNumber` が数字11桁でない | `phoneNumber が不正です。` | - |
| `400` | `postalCode` 未入力 | `postalCode は必須です。` | - |
| `400` | `postalCode` が数字7桁でない | `postalCode が不正です。` | - |
| `400` | `prefecture` 未入力 | `prefecture は必須です。` | - |
| `400` | `streetAddress` 未入力 | `streetAddress は必須です。` | - |
| `400` | `birthDate` 未入力 | `birthDate は必須です。` | - |
| `400` | `birthDate` 形式不正、または実在しない日付 | `birthDate が不正です。` | - |
| `400` | `assignmentDate` 未入力 | `assignmentDate は必須です。` | - |
| `400` | `assignmentDate` 形式不正、または実在しない日付 | `assignmentDate が不正です。` | - |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` | - |
| `403` | APIキー不正 | `APIキーが不正です。` | - |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` | body バリデーション通過後に判定 |
| `405` | PUT 以外のメソッド | `許可されていないHTTPメソッドです。` | - |
| `409` | `email` 重複 | `email はすでに登録されています。` | - |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` | - |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` | - |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` | - |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` | - |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` | - |
| `500` | `auth` 更新失敗 | `auth の更新に失敗しました: ...` | `users` の更新は戻さない |

### 補足

`auth.password` の更新だけが失敗した場合、直前の `users` 更新は取り消されません。  
`users` だけ更新された状態が残る点に注意してください。

## 6. `DELETE /users/{userId}`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `400` | `userId` が正の整数でない | `userId が不正です。` |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` |
| `405` | DELETE 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` |
| `500` | `current_attendance` 解除失敗 | `users.current_attendance の解除に失敗しました: ...` |
| `500` | `attendance_breaks` 削除失敗 | `attendance_breaks の削除に失敗しました: ...` |
| `500` | `attendance` 削除失敗 | `attendance の削除に失敗しました: ...` |
| `500` | `auth` 削除失敗 | `auth の削除に失敗しました: ...` |
| `500` | `users` 削除失敗 | `users の削除に失敗しました: ...` |

### 補足

削除は `users.current_attendance` の解除 → `attendance_breaks` → `attendance` → `auth` → `users` の順で実行します。  
途中で失敗した場合、それ以前に削除・更新したレコードは戻りません。

## 7. `POST /attendance/start`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` |
| `400` | JSON不正 | `リクエストボディが不正です。` |
| `400` | 未定義の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` |
| `400` | `userId` 未指定 | `userId は必須です。` |
| `400` | `userId` が正の整数でない | `userId が不正です。` |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `409` | すでに勤務中 | `すでに勤務中です。` |
| `409` | すでに休憩中 | `すでに休憩中です。` |
| `409` | 進行中勤務が存在 | `進行中勤務がすでに存在します。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` |
| `500` | `attendance` 作成失敗 | `attendance の作成に失敗しました: ...` |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` |

## 8. `POST /attendance/break/start`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` |
| `400` | JSON不正 | `リクエストボディが不正です。` |
| `400` | 未定義の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` |
| `400` | `userId` 未指定 | `userId は必須です。` |
| `400` | `userId` が正の整数でない | `userId が不正です。` |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `409` | 非勤務中 | `非勤務中のため休憩開始できません。` |
| `409` | すでに休憩中 | `すでに休憩中です。` |
| `409` | `current_attendance_id` 未設定 | `current_attendance_id が設定されていません。` |
| `409` | 勤務レコード不整合 | `勤務レコードが不整合です。` |
| `409` | 未終了の休憩あり | `未終了の休憩が存在します。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` |
| `500` | `attendance_breaks` 検索失敗 | `attendance_breaks の検索に失敗しました: ...` |
| `500` | `attendance_breaks` 作成失敗 | `attendance_breaks の作成に失敗しました: ...` |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` |

## 9. `POST /attendance/break/end`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` |
| `400` | JSON不正 | `リクエストボディが不正です。` |
| `400` | 未定義の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` |
| `400` | `userId` 未指定 | `userId は必須です。` |
| `400` | `userId` が正の整数でない | `userId が不正です。` |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `409` | 休憩中ではない | `休憩中ではありません。` |
| `409` | `current_attendance_id` 未設定 | `current_attendance_id が設定されていません。` |
| `409` | 未終了の休憩なし | `未終了の休憩が存在しません。` |
| `409` | 未終了の休憩が複数存在 | `未終了の休憩が複数存在します。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` |
| `500` | `attendance_breaks` 検索失敗 | `attendance_breaks の検索に失敗しました: ...` |
| `500` | `attendance_breaks` 更新失敗 | `attendance_breaks の更新に失敗しました: ...` |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` |

## 10. `POST /attendance/end`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `400` | `Content-Type` 不正 | `Content-Type は application/json を指定してください。` |
| `400` | JSON不正 | `リクエストボディが不正です。` |
| `400` | 未定義の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` |
| `400` | `userId` 未指定 | `userId は必須です。` |
| `400` | `userId` が正の整数でない | `userId が不正です。` |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` |
| `405` | POST 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `409` | 勤務中ではない | `勤務中ではありません。` |
| `409` | 休憩中のため勤務終了不可 | `休憩中のため勤務終了できません。` |
| `409` | `current_attendance_id` 未設定 | `current_attendance_id が設定されていません。` |
| `409` | 勤務レコード不整合 | `勤務レコードが不整合です。` |
| `409` | 未終了の休憩あり | `未終了の休憩が存在します。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` |
| `500` | `attendance_breaks` 検索失敗 | `attendance_breaks の検索に失敗しました: ...` |
| `500` | `attendance` 更新失敗 | `attendance の更新に失敗しました: ...` |
| `500` | `users` 更新失敗 | `users の更新に失敗しました: ...` |

## 11. `GET /attendance/records`

### エラー一覧

| ステータス | 条件 | message |
| --- | --- | --- |
| `400` | `userId` クエリ未指定 | `userId は必須です。` |
| `400` | `targetMonth` クエリ未指定 | `targetMonth は必須です。` |
| `400` | `userId` が正の整数でない | `userId が不正です。` |
| `400` | `targetMonth` 形式不正 | `targetMonth の形式が不正です。` |
| `401` | APIキー未指定 | `x-api-key ヘッダーは必須です。` |
| `403` | APIキー不正 | `APIキーが不正です。` |
| `404` | 対象ユーザーなし | `ユーザーが存在しません。` |
| `405` | GET 以外のメソッド | `許可されていないHTTPメソッドです。` |
| `500` | `INTERNAL_API_KEY` 未設定 | `INTERNAL_API_KEY が設定されていません。` |
| `500` | `SUPABASE_URL` 未設定 | `SUPABASE_URL が設定されていません。` |
| `500` | `SUPABASE_SERVICE_ROLE_KEY` 未設定 | `SUPABASE_SERVICE_ROLE_KEY が設定されていません。` |
| `500` | `users` 検索失敗 | `users の検索に失敗しました: ...` |
| `500` | `attendance` 検索失敗 | `attendance の検索に失敗しました: ...` |
| `500` | `attendance_breaks` 検索失敗 | `attendance_breaks の検索に失敗しました: ...` |

## 補足

- `OPTIONS` リクエストはエラーではなく `200` で `"ok"` を返します。
- `500` の一部は内部例外メッセージをそのまま返すため、テーブル名や設定キー名がレスポンスに含まれます。
- 各 API はメソッド判定 → APIキー検証 → `Content-Type` 検証の順に実行します。そのため許可外メソッドでアクセスした場合は、APIキーが未指定でも `405` を返します。

### 内部例外時の既定メッセージ

`Error` インスタンス以外が throw された場合に限り、各 API は以下の固定メッセージを `500` で返します。  
通常の DB エラーや設定不備では、上表のとおり例外メッセージがそのまま返るため、この固定メッセージは出ません。

| API | message |
| --- | --- |
| `POST /auth/login` | `ログイン処理に失敗しました。` |
| `GET /users` / `GET /users/{userId}` | `ユーザー情報の取得に失敗しました。` |
| `POST /users` | `従業員登録に失敗しました。` |
| `PUT /users/{userId}` | `従業員情報の更新に失敗しました。` |
| `DELETE /users/{userId}` | `従業員の削除に失敗しました。` |
| `POST /attendance/start` | `勤務開始処理に失敗しました。` |
| `POST /attendance/break/start` | `休憩開始処理に失敗しました。` |
| `POST /attendance/break/end` | `休憩終了処理に失敗しました。` |
| `POST /attendance/end` | `勤務終了処理に失敗しました。` |
| `GET /attendance/records` | `勤怠一覧の取得に失敗しました。` |
