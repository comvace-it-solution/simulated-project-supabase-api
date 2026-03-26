# API仕様書

## 概要

このドキュメントは、Supabase Edge Functions で提供する勤怠管理 API の仕様をまとめたものです。  
対象 API は以下の 7 本です。

- `POST /auth/login`
- `GET /users/{userId}`
- `POST /attendance/start`
- `POST /attendance/break/start`
- `POST /attendance/break/end`
- `POST /attendance/end`
- `GET /attendance/records?userId=1&targetMonth=2026-03`

## 実装構成

Edge Functions は以下の 3 function に分かれています。

- `auth`
- `users`
- `attendance`

ルーティングは各 `index.ts` が担当し、実処理はメソッド単位のファイルに分割しています。

## 共通仕様

### ベースURL

ローカル開発時の例:

```text
http://127.0.0.1:54321/functions/v1
```

本番環境の例:

```text
https://<project-ref>.supabase.co/functions/v1
```

## 共通ヘッダー

### 必須ヘッダー

| ヘッダー名 | 必須 | 説明 |
| --- | --- | --- |
| `x-api-key` | 必須 | サーバー側の `INTERNAL_API_KEY` と照合する |

### POST 時の必須ヘッダー

| ヘッダー名 | 必須 | 説明 |
| --- | --- | --- |
| `Content-Type` | 必須 | `application/json` を指定する |

## APIキー認証

全 API で `x-api-key` を検証します。

### 認証ルール

- 未指定: `401`
- 不一致: `403`
- `INTERNAL_API_KEY` 未設定: `500`

## CORS

全 function で以下に対応しています。

- `OPTIONS` リクエスト
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-api-key`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`

## 共通レスポンス形式

### 成功時

```json
{
  "result": "success",
  "message": "処理に成功しました。",
  "data": {}
}
```

### 失敗時

```json
{
  "result": "error",
  "message": "エラー内容",
  "errors": []
}
```

## HTTPステータスコード方針

| ステータス | 用途 |
| --- | --- |
| `200` | 正常終了 |
| `400` | 入力不正、必須不足 |
| `401` | APIキー未指定、または認証不一致 |
| `403` | APIキー不一致 |
| `404` | 対象データなし |
| `405` | 許可されていないHTTPメソッド |
| `409` | 業務ルール違反、状態不整合 |
| `500` | サーバー内部エラー |

## データモデルとの対応

| API | 主に参照・更新するテーブル |
| --- | --- |
| `POST /auth/login` | `users`, `auth` |
| `GET /users/{userId}` | `users` |
| `POST /attendance/start` | `users`, `attendance` |
| `POST /attendance/break/start` | `users`, `attendance`, `attendance_breaks` |
| `POST /attendance/break/end` | `users`, `attendance_breaks` |
| `POST /attendance/end` | `users`, `attendance`, `attendance_breaks` |
| `GET /attendance/records` | `users`, `attendance`, `attendance_breaks` |

## API詳細

## 1. `POST /auth/login`

### 概要

メールアドレスとパスワードを受け取り、ログイン可否を判定します。

### エンドポイント

```text
POST /auth/login
```

### リクエストヘッダー

- `x-api-key`
- `Content-Type: application/json`

### リクエストボディ

```json
{
  "email": "sample@example.com",
  "password": "abc123"
}
```

### 処理内容

1. `x-api-key` を検証
2. `email`, `password` の必須チェック
3. `users.email` でユーザー検索
4. `auth.user_id = users.id` の認証情報を取得
5. `password` 一致判定
6. `userId`, `userName` を返却

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "ログインに成功しました。",
  "data": {
    "userId": 1,
    "userName": "山田太郎"
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `email` 未入力 | `email は必須です。` |
| `400` | `password` 未入力 | `password は必須です。` |
| `401` | `email` または `password` 不一致 | `email または password が一致しません。` |
| `409` | `auth` 未作成 | `auth が作成されていません。` |

## 2. `GET /users/{userId}`

### 概要

ユーザー情報と現在の勤務状態を取得します。

### エンドポイント

```text
GET /users/{userId}
```

### パスパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `userId` | number | 対象ユーザーID |

### 処理内容

1. `x-api-key` を検証
2. `userId` を数値チェック
3. `users` から 1 件取得
4. 取得結果を返却

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "ユーザー情報を取得しました。",
  "data": {
    "id": 1,
    "userName": "山田太郎",
    "email": "sample@example.com",
    "phoneNumber": "09012345678",
    "postalCode": "1234567",
    "prefecture": "東京都",
    "streetAddress": "渋谷区1-2-3",
    "buildingName": "サンプルマンション101",
    "birthDate": "1998-04-01",
    "assignmentDate": "2025-04-01",
    "currentAttendanceState": 1,
    "currentAttendanceId": 10
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `userId` 不正 | `userId が不正です。` |
| `404` | ユーザーなし | `ユーザーが存在しません。` |

## 3. `POST /attendance/start`

### 概要

勤務開始を登録します。

### エンドポイント

```text
POST /attendance/start
```

### リクエストボディ

```json
{
  "userId": 1
}
```

### 処理内容

1. `x-api-key` を検証
2. `userId` 必須チェック
3. `users` を取得
4. `current_attendance_state = null` を確認
5. `attendance` に新規登録
6. 登録した `attendance.id` を取得
7. `users.current_attendance_state = 1` に更新
8. `users.current_attendance_id = attendance.id` に更新

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "勤務開始に成功しました。",
  "data": {
    "attendanceId": 1001,
    "userId": 1,
    "workDate": "2026-03-26",
    "workStartDt": "2026-03-26T00:00:00.000Z"
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `userId` 未入力 | `userId は必須です。` |
| `404` | ユーザーなし | `ユーザーが存在しません。` |
| `409` | すでに勤務中 | `すでに勤務中です。` |
| `409` | すでに休憩中 | `すでに休憩中です。` |
| `409` | 進行中勤務あり | `進行中勤務がすでに存在します。` |

## 4. `POST /attendance/break/start`

### 概要

休憩開始を登録します。

### エンドポイント

```text
POST /attendance/break/start
```

### リクエストボディ

```json
{
  "userId": 1
}
```

### 処理内容

1. `x-api-key` を検証
2. `userId` 必須チェック
3. `users` を取得
4. `current_attendance_state = 1` を確認
5. `current_attendance_id` を取得
6. `attendance.id = current_attendance_id` かつ `attendance.user_id = userId` を確認
7. 未終了休憩がないことを確認
8. `attendance_breaks` に新規登録
9. `users.current_attendance_state = 2` に更新

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "休憩開始に成功しました。",
  "data": {
    "attendanceId": 1001,
    "breakId": 5001,
    "breakStartDt": "2026-03-26T03:00:00.000Z"
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `userId` 未入力 | `userId は必須です。` |
| `404` | ユーザーなし | `ユーザーが存在しません。` |
| `409` | 非勤務中 | `非勤務中のため休憩開始できません。` |
| `409` | すでに休憩中 | `すでに休憩中です。` |
| `409` | `current_attendance_id` なし | `current_attendance_id が設定されていません。` |
| `409` | 勤務レコード不整合 | `勤務レコードが不整合です。` |
| `409` | 未終了休憩あり | `未終了の休憩が存在します。` |

## 5. `POST /attendance/break/end`

### 概要

休憩終了を登録します。

### エンドポイント

```text
POST /attendance/break/end
```

### リクエストボディ

```json
{
  "userId": 1
}
```

### 処理内容

1. `x-api-key` を検証
2. `userId` 必須チェック
3. `users` を取得
4. `current_attendance_state = 2` を確認
5. `current_attendance_id` を取得
6. 未終了休憩を検索
7. `break_end_dt = now` に更新
8. `users.current_attendance_state = 1` に更新

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "休憩終了に成功しました。",
  "data": {
    "attendanceId": 1001,
    "breakId": 5001,
    "breakEndDt": "2026-03-26T04:00:00.000Z"
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `userId` 未入力 | `userId は必須です。` |
| `404` | ユーザーなし | `ユーザーが存在しません。` |
| `409` | 休憩中でない | `休憩中ではありません。` |
| `409` | `current_attendance_id` なし | `current_attendance_id が設定されていません。` |
| `409` | 未終了休憩なし | `未終了の休憩が存在しません。` |
| `409` | 未終了休憩複数 | `未終了の休憩が複数存在します。` |

## 6. `POST /attendance/end`

### 概要

勤務終了を登録します。

### エンドポイント

```text
POST /attendance/end
```

### リクエストボディ

```json
{
  "userId": 1
}
```

### 処理内容

1. `x-api-key` を検証
2. `userId` 必須チェック
3. `users` を取得
4. `current_attendance_state = 1` を確認
5. `current_attendance_id` を取得
6. 対象勤務レコードを確認
7. 未終了休憩がないことを確認
8. `attendance.work_end_dt = now` に更新
9. `users.current_attendance_state = null` に更新
10. `users.current_attendance_id = null` に更新

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "勤務終了に成功しました。",
  "data": {
    "attendanceId": 1001,
    "workEndDt": "2026-03-26T09:00:00.000Z"
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `userId` 未入力 | `userId は必須です。` |
| `404` | ユーザーなし | `ユーザーが存在しません。` |
| `409` | 勤務中でない | `勤務中ではありません。` |
| `409` | 休憩中 | `休憩中のため勤務終了できません。` |
| `409` | `current_attendance_id` なし | `current_attendance_id が設定されていません。` |
| `409` | 未終了休憩あり | `未終了の休憩が存在します。` |
| `409` | 勤務レコード不整合 | `勤務レコードが不整合です。` |

## 7. `GET /attendance/records`

### 概要

指定ユーザー・指定月の勤務と休憩一覧を返します。  
週次・月次の集計はフロント側で実施します。

### エンドポイント

```text
GET /attendance/records?userId=1&targetMonth=2026-03
```

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `userId` | number | 必須 | 対象ユーザーID |
| `targetMonth` | string | 必須 | `YYYY-MM` 形式 |

### 処理内容

1. `x-api-key` を検証
2. `userId` を検証
3. `targetMonth` を検証
4. `users` 存在確認
5. 対象月の `attendance` を取得
6. 紐づく `attendance_breaks` を取得
7. `attendanceRecords` 配列に整形して返却

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "勤怠一覧を取得しました。",
  "data": {
    "userId": 1,
    "targetMonth": "2026-03",
    "attendanceRecords": [
      {
        "id": 1001,
        "workDate": "2026-03-03",
        "workStartDt": "2026-03-03T09:00:00+09:00",
        "workEndDt": "2026-03-03T18:00:00+09:00",
        "breaks": [
          {
            "id": 5001,
            "breakStartDt": "2026-03-03T12:00:00+09:00",
            "breakEndDt": "2026-03-03T13:00:00+09:00"
          }
        ]
      }
    ]
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `userId` 未指定 | `userId は必須です。` |
| `400` | `targetMonth` 未指定 | `targetMonth は必須です。` |
| `400` | `targetMonth` 形式不正 | `targetMonth の形式が不正です。` |
| `404` | ユーザーなし | `ユーザーが存在しません。` |

## ルーティング仕様

### `auth` function

| パス | メソッド | 実処理 |
| --- | --- | --- |
| `/auth/login` | `POST` | ログイン |

### `users` function

| パス | メソッド | 実処理 |
| --- | --- | --- |
| `/users/{userId}` | `GET` | ユーザー取得 |

### `attendance` function

| パス | メソッド | 実処理 |
| --- | --- | --- |
| `/attendance/start` | `POST` | 勤務開始 |
| `/attendance/break/start` | `POST` | 休憩開始 |
| `/attendance/break/end` | `POST` | 休憩終了 |
| `/attendance/end` | `POST` | 勤務終了 |
| `/attendance/records` | `GET` | 月次勤怠一覧取得 |

## 使用する環境変数

| 環境変数名 | 用途 |
| --- | --- |
| `SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key |
| `INTERNAL_API_KEY` | `x-api-key` と照合する内部APIキー |

## トランザクションに関する注意

更新系 API は順序制御とエラーハンドリングで整合性を保つように実装しています。  
ただし、Supabase JS client 経由の通常処理では PostgreSQL の厳密なトランザクションをそのまま扱っているわけではありません。

現在の実装では、以下のような補償処理を入れています。

- 勤務開始後に `users` 更新が失敗した場合は、作成した `attendance` を削除
- 休憩開始後に `users` 更新が失敗した場合は、作成した `attendance_breaks` を削除
- 休憩終了後に `users` 更新が失敗した場合は、`break_end_dt` を `null` に戻す
- 勤務終了後に `users` 更新が失敗した場合は、`work_end_dt` を `null` に戻す

厳密な原子性が必要になった場合は、以下を検討してください。

- PostgreSQL function を作成して RPC 化する
- 1 API 1 RPC の形で DB 側に処理を寄せる
- 競合制御が必要な箇所で DB 主導の実装に寄せる

## 動作確認例

### ローカル serve

```bash
supabase functions serve --env-file supabase/functions/.env.local --no-verify-jwt
```

### デプロイ

```bash
supabase functions deploy auth
supabase functions deploy users
supabase functions deploy attendance
```
