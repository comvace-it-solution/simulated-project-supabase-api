# DB仕様書

## 概要

このドキュメントは、勤怠管理APIで使用する PostgreSQL / Supabase の DB 仕様をまとめたものです。  
対象テーブルは以下の 4 つです。

- `public.users`
- `public.auth`
- `public.attendance`
- `public.attendance_breaks`

本リポジトリでは、DB 定義を migration 方式で管理しています。  
実際の作成 SQL は `supabase/migrations/20260326030257_init_attendance_schema.sql` にあります。

## 設計方針

### migration 方式

DB の変更は GUI で直接変更せず、SQL migration として履歴管理します。  
これにより、誰がどの順序でどの変更を入れたかを追跡しやすくなり、環境差分も減らせます。

### `updated_dt` の自動更新

更新日時は API 側で毎回設定するのではなく、DB trigger で自動更新します。  
そのため、複数の API や運用スクリプトから更新しても、`updated_dt` の更新漏れを防げます。

共通 function:

- `public.fn_set_updated_dt()`

trigger 設定対象:

- `public.users`
- `public.attendance`
- `public.attendance_breaks`

### 進行中レコードの一意制御

以下のルールは partial unique index で DB 側でも制御しています。

- 同一ユーザーの進行中勤務は 1 件まで
- 同一勤務の進行中休憩は 1 件まで

これにより、アプリの多重送信や競合時にも整合性が崩れにくくなります。

## テーブル一覧

| テーブル名 | 用途 |
| --- | --- |
| `public.users` | ユーザー基本情報、現在の勤務状態 |
| `public.auth` | ログイン照合用の認証情報 |
| `public.attendance` | 勤務開始・勤務終了の記録 |
| `public.attendance_breaks` | 休憩開始・休憩終了の記録 |

## テーブル詳細

## `public.users`

### 用途

ユーザーの基本情報と、現在の勤務状態を保持します。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `id` | `int` | NOT NULL | identity | ユーザーID |
| `user_name` | `varchar(50)` | NOT NULL | なし | 氏名 |
| `email` | `varchar(50)` | NOT NULL | なし | メールアドレス |
| `phone_number` | `char(11)` | NULL 可 | なし | 電話番号 |
| `postal_code` | `char(7)` | NULL 可 | なし | 郵便番号 |
| `prefecture` | `varchar(20)` | NULL 可 | なし | 都道府県 |
| `street_address` | `varchar(255)` | NULL 可 | なし | 住所 |
| `building_name` | `varchar(255)` | NULL 可 | なし | 建物名 |
| `birth_date` | `date` | NULL 可 | なし | 生年月日 |
| `current_attendance_state` | `smallint` | NULL 可 | なし | 現在の勤務状態 |
| `current_attendance_id` | `int` | NULL 可 | なし | 現在進行中の勤務ID |
| `assignment_date` | `date` | NOT NULL | なし | 配属日 |
| `created_at` | `timestamptz` | NOT NULL | `current_timestamp` | 作成日時 |
| `updated_dt` | `timestamptz` | NOT NULL | `current_timestamp` | 更新日時 |

### `current_attendance_state` の意味

| 値 | 意味 |
| --- | --- |
| `1` | 勤務中 |
| `2` | 休憩中 |
| `null` | 非勤務中 |

### 制約

- 主キー: `pk_users`
- 一意制約: `uq_users_email`
- 外部キー: `fk_users_current_attendance_id_attendance_id`
- チェック制約: `chk_users_phone_number_format`
- チェック制約: `chk_users_postal_code_format`
- チェック制約: `chk_users_current_attendance_state`
- チェック制約: `chk_users_attendance_state_requires_id`
- チェック制約: `chk_users_attendance_id_requires_state`

### 制約内容

- `email` は一意
- `phone_number` は 11 桁の数字のみ
- `postal_code` は 7 桁の数字のみ
- `current_attendance_state` は `1`, `2`, `null` のみ
- `current_attendance_state` が `1` または `2` の場合、`current_attendance_id` は必須
- `current_attendance_state` が `null` の場合、`current_attendance_id` も `null`

### index / trigger

- index: `idx_users_current_attendance_id`
- trigger: `trg_users_set_updated_dt`

## `public.auth`

### 用途

ログイン判定に必要な認証情報を保持します。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `id` | `int` | NOT NULL | identity | 認証レコードID |
| `user_id` | `int` | NOT NULL | なし | 対応ユーザーID |
| `password` | `char(6)` | NOT NULL | なし | 6桁固定パスワード |

### 制約

- 主キー: `pk_auth`
- 一意制約: `uq_auth_user_id`
- 外部キー: `fk_auth_user_id_users_id`
- チェック制約: `chk_auth_password_length_and_charset`

### 制約内容

- `user_id` は一意
- `password` は 6 桁固定
- `password` は半角英数字のみ

### 補足

Supabase には組み込みの `auth` スキーマがあります。  
このテーブルは `public.auth` であり、`auth.users` などの Supabase Auth 組み込みテーブルとは別です。

## `public.attendance`

### 用途

勤務開始と勤務終了を管理します。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `id` | `int` | NOT NULL | identity | 勤務ID |
| `user_id` | `int` | NOT NULL | なし | 対応ユーザーID |
| `work_date` | `date` | NOT NULL | なし | 勤務日 |
| `work_start_dt` | `timestamptz` | NOT NULL | なし | 勤務開始日時 |
| `work_end_dt` | `timestamptz` | NULL 可 | なし | 勤務終了日時 |
| `updated_dt` | `timestamptz` | NOT NULL | `current_timestamp` | 更新日時 |

### 制約

- 主キー: `pk_attendance`
- 外部キー: `fk_attendance_user_id_users_id`
- チェック制約: `chk_attendance_work_end_after_start`
- チェック制約: `chk_attendance_work_date_matches_start`

### 制約内容

- `work_end_dt` は `work_start_dt` 以上
- `work_date = work_start_dt::date`

### index / trigger

- index: `idx_attendance_user_id`
- index: `idx_attendance_user_id_work_date`
- unique index: `uq_attendance_user_id_active`
- trigger: `trg_attendance_set_updated_dt`

### 業務ルール

- 同一ユーザーの進行中勤務は 1 件まで
- `work_end_dt is null` の行に対して `uq_attendance_user_id_active` で制御

### API 側で担保すること

- `attendance.id = users.current_attendance_id` であること
- `attendance.user_id = users.id` であること

## `public.attendance_breaks`

### 用途

勤務中の休憩開始と休憩終了を管理します。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `id` | `int` | NOT NULL | identity | 休憩ID |
| `attendance_id` | `int` | NOT NULL | なし | 対応勤務ID |
| `break_start_dt` | `timestamptz` | NOT NULL | なし | 休憩開始日時 |
| `break_end_dt` | `timestamptz` | NULL 可 | なし | 休憩終了日時 |
| `updated_dt` | `timestamptz` | NOT NULL | `current_timestamp` | 更新日時 |

### 制約

- 主キー: `pk_attendance_breaks`
- 外部キー: `fk_attendance_breaks_attendance_id_attendance_id`
- チェック制約: `chk_attendance_breaks_end_after_start`

### 制約内容

- `break_end_dt` は `break_start_dt` 以上

### index / trigger

- index: `idx_attendance_breaks_attendance_id`
- unique index: `uq_attendance_breaks_attendance_id_active`
- trigger: `trg_attendance_breaks_set_updated_dt`

### 業務ルール

- 同一勤務内で進行中休憩は 1 件まで
- `break_end_dt is null` の行に対して `uq_attendance_breaks_attendance_id_active` で制御

### API 側で担保すること

- 休憩時刻が対応する勤務時間内であること

## テーブル間の関連

```text
users (1) ---- (1) auth
users (1) ---- (N) attendance
attendance (1) ---- (N) attendance_breaks
users.current_attendance_id ---- attendance.id
```

### 外部キー関係

- `auth.user_id -> users.id`
- `attendance.user_id -> users.id`
- `attendance_breaks.attendance_id -> attendance.id`
- `users.current_attendance_id -> attendance.id`

## 循環参照への対応

今回の設計では、`users.current_attendance_id -> attendance.id` と `attendance.user_id -> users.id` があるため、  
`users` と `attendance` は循環参照になります。

そのため migration では以下の順序で作成しています。

1. `users` を作成
2. `auth` を作成
3. `attendance` を作成
4. `attendance_breaks` を作成
5. 最後に `users.current_attendance_id` の FK を `alter table` で追加

## API と DB の責務分担

### DB 側で担保しているもの

- 主キー、一意制約、外部キー
- 桁数や形式のチェック
- 更新日時の自動更新
- 進行中勤務 1 件制限
- 進行中休憩 1 件制限

### API 側で担保しているもの

- `users.email` からのログイン判定
- `auth.password` の一致判定
- 現在の勤務状態に応じた開始・終了可否
- `current_attendance_id` と実勤務レコードの整合性確認
- 未終了休憩の存在確認
- 月次取得 API のレスポンス整形

## 補足

- `work_date = work_start_dt::date` は DB セッションのタイムゾーンに依存します。
- 業務日付を JST 固定にしたい場合は、DB 制約と API 側の日付生成ロジックを JST 基準にそろえる設計を検討してください。
- 更新系処理の完全な原子性が必要な場合は、将来的に PostgreSQL function / RPC 化を検討してください。
