# Supabase CLI を使ったローカル DB 初期構築手順

このリポジトリは、Supabase CLI を使ってローカルの PostgreSQL を立ち上げ、`supabase/migrations/*.sql` で DB 定義を管理する前提です。  
クローン直後の状態から、誰でも同じ手順でローカル DB を再現できるようにしています。

## この README の目的

- クローン直後に何をすればよいか分かるようにする
- `supabase init` を起点にした初期構築手順を残す
- migration 方式でスキーマを管理する理由を共有する
- 今回作成した勤怠管理向けテーブル定義を理解しやすくする

## 前提

- Supabase CLI を使う
- ローカル開発は Docker 上で動かす
- DB 定義は SQL の migration で管理する
- テーブルは `public.users`, `public.auth`, `public.attendance`, `public.attendance_breaks` を使う

## まず理解しておきたいこと

### migration 方式とは何か

migration 方式は、DB の変更履歴を SQL ファイルとして順番に管理するやり方です。  
たとえば「テーブルを作った」「制約を追加した」という変更を、1 回ごとの SQL ファイルとして残します。

この方式にすると、次の利点があります。

- 誰がいつどんな DB 変更を入れたか追いやすい
- クローン直後でも、同じ migration を流せば同じ DB を再現できる
- 開発環境、検証環境、本番環境で差分が出にくい
- GUI で直接 DB を手修正する運用より、レビューしやすい

### なぜ SQL を直接手で変更せず migration で管理するのか

ローカル DB に直接 `CREATE TABLE` や `ALTER TABLE` を打つだけだと、あとから見た人が再現できません。  
一方で migration として SQL をコミットしておけば、履歴と再現性が残ります。

つまり migration は、DB の「完成形」を管理するだけではなく、「どう変化してきたか」を管理するための仕組みです。

### なぜ `updated_dt` を trigger で自動更新するのか

`updated_dt` をアプリ側で毎回更新する設計だと、更新 SQL の書き忘れで値が壊れやすくなります。  
そこで DB trigger で強制的に更新するようにしておくと、どの API から更新しても同じルールで `updated_dt` が入ります。

今回は共通 function `public.fn_set_updated_dt()` を 1 つ作り、各テーブルの `before update` trigger から使っています。

### なぜ partial unique index で「進行中は 1 件まで」を制限するのか

勤怠や休憩は、「終了していないレコード」が同時に複数あると整合性が崩れます。  
この制約はアプリロジックでも確認しますが、DB 側でも防御しておくと二重登録を防ぎやすくなります。

今回の定義では、以下を partial unique index で実現しています。

- `attendance`: `work_end_dt is null` の行は、同一 `user_id` で 1 件まで
- `attendance_breaks`: `break_end_dt is null` の行は、同一 `attendance_id` で 1 件まで

通常の unique 制約では「終了済みレコードは複数あってよい」という条件付き制約を表現しにくいため、partial unique index を使います。

## クローン直後からのセットアップ手順

### 1. リポジトリをクローンする

```bash
git clone <repository-url>
cd simulated-project-supabase-api
```

最初に作業ディレクトリへ移動します。  
以降の `supabase` コマンドは、このリポジトリ直下で実行します。

### 2. Supabase CLI が使えるか確認する

```bash
supabase --version
```

この確認が必要な理由は、ローカル DB 起動や migration 作成・適用がすべて Supabase CLI 前提だからです。  
バージョンが表示されれば利用可能です。

### 3. Supabase プロジェクトの初期化を行う

```bash
supabase init
```

このコマンドは、ローカル開発に必要な `supabase/` ディレクトリを作ります。  
初期化後は少なくとも次のような構成になります。

```text
.
├── README.md
└── supabase
    ├── config.toml
    ├── seed.sql
    └── migrations
        └── 20260326030257_init_attendance_schema.sql
```

主な役割は以下の通りです。

- `supabase/config.toml`: ローカル Supabase の設定
- `supabase/migrations/*.sql`: DB スキーマ変更履歴
- `supabase/seed.sql`: 初期データ投入用 SQL

### 4. migration ファイルを作る

```bash
supabase migration new init_attendance_schema
```

このコマンドで、時刻付きの空 migration ファイルが `supabase/migrations/` 配下に生成されます。  
今回は以下のファイルを作成しています。

```text
supabase/migrations/20260326030257_init_attendance_schema.sql
```

このファイルに、テーブル作成・制約・index・trigger をまとめて記述します。

### 5. ローカル Supabase を起動する

```bash
supabase start
```

このコマンドで Docker 上に Supabase のローカル環境が立ち上がります。  
DB だけでなく、API や Studio なども一緒に起動します。

### 6. migration をローカル DB に反映する

初回セットアップや、migration を編集した直後は次を使うのが分かりやすいです。

```bash
supabase db reset
```

`db reset` は、ローカル DB を作り直して migration を先頭から再適用します。  
スキーマの再現性確認に向いているため、初期構築時は特に使いやすいです。

すでに DB が起動していて、未適用 migration だけを流したい場合は次でも構いません。

```bash
supabase migration up
```

### 7. 必要なら Supabase Studio で確認する

```bash
supabase status
```

起動後の接続情報や URL を確認して、Studio からテーブル定義を目視確認できます。

## 日常的な開発フロー

### 新しい DB 変更を追加したいとき

1. 新しい migration を作る

```bash
supabase migration new <change_name>
```

2. 生成された SQL を編集する
3. ローカル DB に適用する

```bash
supabase db reset
```

この流れに統一すると、「手元でだけ直した変更」が残りにくくなります。

## 今回の DB 設計

### テーブル一覧

- `public.users`: ユーザー基本情報
- `public.auth`: ログイン照合用の簡易認証情報
- `public.attendance`: 勤務開始・終了
- `public.attendance_breaks`: 休憩開始・終了

### 補足: `public.auth` テーブル名について

Supabase には組み込みの `auth` スキーマがあります。  
今回作成しているのは `public` スキーマ配下の `auth` テーブルです。  
名前は同じですが、`auth.users` のような組み込み認証テーブルとは別物です。

### `users` と `attendance` の循環参照への対応

今回の設計では、以下の関係があります。

- `attendance.user_id -> users.id`
- `users.current_attendance_id -> attendance.id`

このまま同時に作ろうとすると循環参照になります。  
そのため migration では次の順序にしています。

1. `users` を先に作る
2. `attendance` を作る
3. 最後に `users.current_attendance_id` の外部キーを `alter table` で追加する

この順序にすると、migration を 1 本の SQL で安全に流せます。

### API ロジック側で担保すること

DB 制約だけでは表現しないルールもあります。以下は API 側で必ず確認してください。

- ログイン時は `users.email` でユーザー特定後、`auth.user_id` と `password` を照合する
- `attendance.id = users.current_attendance_id` であること
- `attendance.user_id = users.id` であること
- 休憩時刻が対応する勤務時間内であること

## migration に含めた内容

### `users`

- 主キー: `pk_users`
- 一意制約: `uq_users_email`
- 郵便番号 7 桁チェック
- 電話番号 11 桁チェック
- 勤務状態と `current_attendance_id` の整合性チェック
- `updated_dt` 自動更新 trigger

### `auth`

- 主キー: `pk_auth`
- 一意制約: `uq_auth_user_id`
- 外部キー: `fk_auth_user_id_users_id`
- `password` は 6 桁固定かつ半角英数字チェック

### `attendance`

- 主キー: `pk_attendance`
- 外部キー: `fk_attendance_user_id_users_id`
- `work_end_dt >= work_start_dt`
- `work_date = work_start_dt::date`
- `uq_attendance_user_id_active` で進行中勤務を 1 件に制限
- `updated_dt` 自動更新 trigger

`work_date = work_start_dt::date` は、DB セッションのタイムゾーンで日付化した結果を使います。  
業務上の基準日を JST などに固定したい場合は、将来的に `at time zone` を使った定義へ見直してください。

### `attendance_breaks`

- 主キー: `pk_attendance_breaks`
- 外部キー: `fk_attendance_breaks_attendance_id_attendance_id`
- `break_end_dt >= break_start_dt`
- `uq_attendance_breaks_attendance_id_active` で進行中休憩を 1 件に制限
- `updated_dt` 自動更新 trigger

## このリポジトリをクローンした人が最初にやること

最低限の流れだけ先に知りたい場合は、次の順で実行してください。

```bash
git clone <repository-url>
cd simulated-project-supabase-api
supabase --version
supabase start
supabase db reset
```

すでにこのリポジトリには `supabase/` と migration が含まれているため、通常は再度 `supabase init` を打つ必要はありません。  
ただし「この README がどうやって作られたか」を理解するために、初期構築の手順として `supabase init` も上で説明しています。

## 参考コマンド

```bash
supabase status
supabase stop
supabase db reset
supabase migration list
supabase migration up
```

## 今後の運用ルール

- テーブルや制約の変更は、既存 migration を書き換えず新しい migration を追加する
- ローカルで直接 SQL を打って終わりにしない
- schema 変更後は `supabase db reset` で再現性を確認する
- 制約名、index 名、trigger 名、function 名は明示的に付ける

このルールにしておくと、レビュー・差分確認・環境再現がしやすくなります。
