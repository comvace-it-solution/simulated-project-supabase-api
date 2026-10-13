# API仕様書

## 概要

このドキュメントは、Supabase Edge Functions で提供する勤怠管理 API の仕様をまとめたものです。  
対象 API は以下の 11 本です。

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

### POST / PUT 時の必須ヘッダー

| ヘッダー名 | 必須 | 説明 |
| --- | --- | --- |
| `Content-Type` | 必須 | `application/json` を指定する |

`DELETE /users/{userId}` はボディを受け取らないため、`Content-Type` の検証は行いません。

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

`Access-Control-Allow-Methods` は function ごとに異なります。

| function | `Access-Control-Allow-Methods` |
| --- | --- |
| `auth` | `GET, POST, OPTIONS` |
| `users` | `GET, POST, PUT, DELETE, OPTIONS` |
| `attendance` | `GET, POST, OPTIONS` |

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
  "message": "エラー内容"
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

## 共通バリデーション仕様

更新系 API の入力チェックは以下の方針で統一しています。

| 項目 | ルール |
| --- | --- |
| 文字列全般 | 前後の空白を除去してから必須判定する |
| 許可外 body 項目 | 定義外のキーが 1 つでもあれば `400` |
| `userId` | 正の整数のみ（`^[1-9][0-9]*$`） |
| `email` | `ローカル部@ドメイン.TLD` の簡易形式チェック |
| `password` | 半角英数字6文字（`^[A-Za-z0-9]{6}$`） |
| `phoneNumber` | 数字11桁 |
| `postalCode` | 数字7桁 |
| `birthDate` / `assignmentDate` | `YYYY-MM-DD` 形式かつ実在する日付 |
| `targetMonth` | `YYYY-MM` 形式 |

## データモデルとの対応

| API | 主に参照・更新するテーブル |
| --- | --- |
| `POST /auth/login` | `users`, `auth` |
| `GET /users` | `users` |
| `GET /users/{userId}` | `users` |
| `POST /users` | `users`, `auth` |
| `PUT /users/{userId}` | `users`, `auth` |
| `DELETE /users/{userId}` | `users`, `auth`, `attendance`, `attendance_breaks` |
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

## 2. `GET /users`

### 概要

従業員一覧を取得します。

### エンドポイント

```text
GET /users
```

### 処理内容

1. `x-api-key` を検証
2. `users` を ID 昇順で取得
3. 一覧を返却

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "ユーザー一覧を取得しました。",
  "data": {
    "users": [
      {
        "id": 1,
        "userName": "山田太郎",
        "email": "sample@example.com",
        "birthDate": "1990-01-01",
        "assignmentDate": "2026-03-28",
        "currentAttendanceState": 1,
        "currentAttendanceId": 10
      }
    ]
  }
}
```

## 3. `GET /users/{userId}`

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

## 4. `POST /users`

### 概要

従業員情報と認証情報を新規登録します。  
`users` と `auth` の 2 テーブルに登録します。

### エンドポイント

```text
POST /users
```

### リクエストヘッダー

- `x-api-key`
- `Content-Type: application/json`

### リクエストボディ

```json
{
  "userName": "山田太郎",
  "password": "abc123",
  "email": "sample@example.com",
  "phoneNumber": "09012345678",
  "postalCode": "1500001",
  "prefecture": "東京都",
  "streetAddress": "渋谷区神宮前1-2-3",
  "buildingName": "サンプルビル 5F",
  "birthDate": "1990-04-01",
  "assignmentDate": "2025-04-01"
}
```

### リクエストボディ項目

| 項目 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `userName` | string | 必須 | 氏名 |
| `password` | string | 必須 | 半角英数字6文字 |
| `email` | string | 必須 | メールアドレス |
| `phoneNumber` | string | 必須 | 数字11桁 |
| `postalCode` | string | 必須 | 数字7桁 |
| `prefecture` | string | 必須 | 都道府県 |
| `streetAddress` | string | 必須 | 住所 |
| `buildingName` | string | 任意 | 建物名。空文字の場合は `null` で登録する |
| `birthDate` | string | 必須 | `YYYY-MM-DD` |
| `assignmentDate` | string | 必須 | `YYYY-MM-DD` |

上記以外のキーが含まれている場合は `400` を返します。

### 処理内容

1. `x-api-key` と `Content-Type` を検証
2. JSON ボディを読み取り、許可項目のみかを検証
3. 各項目の必須・形式チェック
4. `users` に登録して `id` を取得
5. `auth` に `user_id` と `password` を登録
6. `auth` 登録が失敗した場合は、作成済みの `users` を削除して `500` を返す
7. 登録した `userId` を返却

`current_attendance_state` と `current_attendance_id` は登録時に設定しないため、初期状態は非勤務中になります。

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "従業員登録に成功しました。",
  "data": {
    "userId": 2
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | 必須項目が未入力 | `userName は必須です。` |
| `400` | `password` 形式不正 | `password は半角英数字6文字で入力してください。` |
| `400` | `email` 形式不正 | `email が不正です。` |
| `400` | `phoneNumber` 形式不正 | `phoneNumber が不正です。` |
| `400` | `postalCode` 形式不正 | `postalCode が不正です。` |
| `400` | 日付形式不正 | `birthDate が不正です。` |
| `400` | 許可外の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` |
| `409` | `email` 重複 | `email はすでに登録されています。` |

## 5. `PUT /users/{userId}`

### 概要

指定した従業員の情報を更新します。  
`password` を指定した場合のみ `auth` も更新します。

### エンドポイント

```text
PUT /users/{userId}
```

### リクエストヘッダー

- `x-api-key`
- `Content-Type: application/json`

### パスパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `userId` | number | 更新対象ユーザーID |

### リクエストボディ

```json
{
  "userName": "山田太郎",
  "email": "sample@example.com",
  "phoneNumber": "09012345678",
  "postalCode": "1500001",
  "prefecture": "東京都",
  "streetAddress": "渋谷区神宮前1-2-3",
  "buildingName": "サンプルビル 5F",
  "birthDate": "1990-04-01",
  "assignmentDate": "2025-04-01"
}
```

### リクエストボディ項目

| 項目 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `userName` | string | 必須 | 氏名 |
| `password` | string | 任意 | 変更する場合のみ指定する。半角英数字6文字 |
| `email` | string | 必須 | メールアドレス |
| `phoneNumber` | string | 必須 | 数字11桁 |
| `postalCode` | string | 必須 | 数字7桁 |
| `prefecture` | string | 必須 | 都道府県 |
| `streetAddress` | string | 必須 | 住所 |
| `buildingName` | string | 任意 | 建物名。空文字の場合は `null` で更新する |
| `birthDate` | string | 必須 | `YYYY-MM-DD` |
| `assignmentDate` | string | 必須 | `YYYY-MM-DD` |

`password` を空文字または未指定にした場合、パスワードは変更しません。  
`userId` は body では変更できません。

### 処理内容

1. `x-api-key` と `Content-Type` を検証
2. `userId` を数値チェック
3. JSON ボディを読み取り、許可項目のみかを検証
4. 各項目の必須・形式チェック（`password` は入力がある場合のみ形式チェック）
5. `users` の存在確認
6. `users` を更新
7. `password` の入力がある場合のみ `auth.password` を更新
8. 更新対象の `userId` を返却

`current_attendance_state` と `current_attendance_id` はこの API では更新しません。

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "従業員情報を更新しました。",
  "data": {
    "userId": 2
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `userId` 不正 | `userId が不正です。` |
| `400` | 必須項目が未入力 | `userName は必須です。` |
| `400` | `password` 形式不正 | `password は半角英数字6文字で入力してください。` |
| `400` | 許可外の body 項目を含む | `リクエストボディに許可されていない項目が含まれています。` |
| `404` | ユーザーなし | `ユーザーが存在しません。` |
| `409` | `email` 重複 | `email はすでに登録されています。` |

## 6. `DELETE /users/{userId}`

### 概要

指定した従業員を削除します。  
勤怠と休憩の記録も含めた物理削除です。論理削除ではないため、復元はできません。

### エンドポイント

```text
DELETE /users/{userId}
```

### リクエストヘッダー

- `x-api-key`

ボディは受け取らないため `Content-Type` は不要です。

### パスパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `userId` | number | 削除対象ユーザーID |

### 処理内容

1. `x-api-key` を検証
2. `userId` を数値チェック
3. `users` の存在確認
4. 対象ユーザーの `attendance.id` 一覧を取得
5. `users.current_attendance_state` と `users.current_attendance_id` を `null` に更新
6. 取得した `attendance.id` に紐づく `attendance_breaks` を削除
7. `attendance` を削除
8. `auth` を削除
9. `users` を削除
10. 削除した `userId` を返却

削除順序は外部キー制約に合わせています。  
特に手順 5 は、`users.current_attendance_id -> attendance.id` の参照を外してから `attendance` を削除するために必要です。

### 成功レスポンス例

```json
{
  "result": "success",
  "message": "従業員を削除しました。",
  "data": {
    "userId": 2
  }
}
```

### エラー

| ステータス | 条件 | メッセージ例 |
| --- | --- | --- |
| `400` | `userId` 不正 | `userId が不正です。` |
| `404` | ユーザーなし | `ユーザーが存在しません。` |
| `500` | 関連レコードの削除に失敗 | `attendance の削除に失敗しました: ...` |

勤務中・休憩中のユーザーでも削除できます。進行中の勤怠もまとめて削除されます。

## 7. `POST /attendance/start`

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

## 8. `POST /attendance/break/start`

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

## 9. `POST /attendance/break/end`

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

## 10. `POST /attendance/end`

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

## 11. `GET /attendance/records`

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
| `/users` | `GET` | ユーザー一覧取得 |
| `/users` | `POST` | 従業員登録 |
| `/users/{userId}` | `GET` | ユーザー取得 |
| `/users/{userId}` | `PUT` | 従業員情報更新 |
| `/users/{userId}` | `DELETE` | 従業員削除 |

`users` function はパスセグメント数とメソッドでルーティングを決めます。

- セグメントなし: `POST` は登録、それ以外は一覧取得
- セグメント 1 つ: `DELETE` は削除、`PUT` は更新、それ以外は 1 件取得
- セグメント 2 つ以上: `404`

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

- 従業員登録で `auth` 作成が失敗した場合は、作成した `users` を削除
- 勤務開始後に `users` 更新が失敗した場合は、作成した `attendance` を削除
- 休憩開始後に `users` 更新が失敗した場合は、作成した `attendance_breaks` を削除
- 休憩終了後に `users` 更新が失敗した場合は、`break_end_dt` を `null` に戻す
- 勤務終了後に `users` 更新が失敗した場合は、`work_end_dt` を `null` に戻す

一方で、以下は補償処理を持っていないため、途中で失敗すると中途半端な状態が残ります。

- 従業員更新で `users` 更新に成功し、`auth.password` 更新で失敗した場合、`users` の更新内容は戻らない
- 従業員削除で関連レコード削除の途中で失敗した場合、削除済みのレコードは戻らない

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
