# 環境構築メモ

## Supabase CLI のインストール

Homebrew を使って Supabase CLI をインストールした。

```bash
brew install supabase/tap/supabase
supabase --version
```

`supabase --version` で CLI がインストール済みであることを確認する。

## Supabase プロジェクトの初期化

Supabase CLI でローカル設定ファイルを作成する。

```bash
supabase init
```

## Supabase へのログイン

Supabase CLI からアカウント認証を行う。

```bash
supabase login
```

## Supabase プロジェクトの紐付け

既存の Supabase プロジェクトにローカル環境を紐付ける。

```bash
supabase link --project-ref <project-ref>
```

`<project-ref>` には対象の Supabase プロジェクトの Project ID を指定する。

## API を作成する方法

Supabase Edge Functions を使って API を作成する。

```bash
supabase functions new users
```

作成後、API の実装は `supabase/functions/users/index.ts` に記述する。

ローカルで確認する場合は Supabase を起動する。

```bash
supabase start
```

Edge Function は `/functions/v1/<function-name>` で呼び出せる。
