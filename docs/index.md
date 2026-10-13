---
layout: home

hero:
  name: 勤怠管理システム
  text: API / DB 仕様書
  tagline: Supabase Edge Functions + PostgreSQL
  actions:
    - theme: brand
      text: API仕様書を見る
      link: /api-spec
    - theme: alt
      text: DB仕様書を見る
      link: /db-spec

features:
  - title: API仕様書
    details: 11 本のエンドポイントのリクエスト・レスポンス・処理内容をまとめています。
    link: /api-spec
    linkText: 開く
  - title: APIエラー仕様書
    details: ステータスコードごとの message と発生条件を API 単位で一覧化しています。
    link: /api-spec-errors
    linkText: 開く
  - title: DB仕様書
    details: 4 テーブルのカラム定義、制約、index、trigger をまとめています。
    link: /db-spec
    linkText: 開く
---

## このサイトについて

勤怠管理システムの API と DB の仕様をまとめたサイトです。  
`docs/` 配下の Markdown をそのまま公開しています。

仕様の正は実装です。齟齬があった場合は以下を基準に判断してください。

| 対象 | 正とするもの |
| --- | --- |
| API の挙動・メッセージ | `supabase/functions/` の各ハンドラ |
| DB のカラム・制約 | `supabase/migrations/*.sql` |

## 共通仕様

全 API で以下が共通です。詳細は [API仕様書](/api-spec) を参照してください。

- 認証は `x-api-key` ヘッダーと `INTERNAL_API_KEY` の照合のみ
- レスポンスは `result` / `message` / `data` の 3 項目で統一
- 失敗時は `result: "error"` と `message` のみを返す

```json
{
  "result": "success",
  "message": "処理に成功しました。",
  "data": {}
}
```

## エンドポイント一覧

| メソッド | パス | 概要 |
| --- | --- | --- |
| `POST` | [`/auth/login`](/api-spec#_1-post-auth-login) | ログイン |
| `GET` | [`/users`](/api-spec#_2-get-users) | 従業員一覧取得 |
| `GET` | [`/users/{userId}`](/api-spec#_3-get-users-userid) | 従業員詳細取得 |
| `POST` | [`/users`](/api-spec#_4-post-users) | 従業員登録 |
| `PUT` | [`/users/{userId}`](/api-spec#_5-put-users-userid) | 従業員情報更新 |
| `DELETE` | [`/users/{userId}`](/api-spec#_6-delete-users-userid) | 従業員削除 |
| `POST` | [`/attendance/start`](/api-spec#_7-post-attendance-start) | 勤務開始 |
| `POST` | [`/attendance/break/start`](/api-spec#_8-post-attendance-break-start) | 休憩開始 |
| `POST` | [`/attendance/break/end`](/api-spec#_9-post-attendance-break-end) | 休憩終了 |
| `POST` | [`/attendance/end`](/api-spec#_10-post-attendance-end) | 勤務終了 |
| `GET` | [`/attendance/records`](/api-spec#_11-get-attendance-records) | 月次勤怠一覧取得 |

## テーブル一覧

| テーブル | 用途 |
| --- | --- |
| [`public.users`](/db-spec#public-users) | ユーザー基本情報、現在の勤務状態 |
| [`public.auth`](/db-spec#public-auth) | ログイン照合用の認証情報 |
| [`public.attendance`](/db-spec#public-attendance) | 勤務開始・勤務終了の記録 |
| [`public.attendance_breaks`](/db-spec#public-attendance-breaks) | 休憩開始・休憩終了の記録 |

## ローカルでの確認方法

```bash
npm install
npm run docs:dev
```

静的ファイルを生成する場合は次を実行します。

```bash
npm run docs:build
npm run docs:preview
```
