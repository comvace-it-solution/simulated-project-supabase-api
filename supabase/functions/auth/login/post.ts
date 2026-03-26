import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { assertApiKey } from "../_shared/auth.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import {
  errorResponse,
  successResponse,
} from "../_shared/response.ts";
import {
  HttpError,
  assertJsonContentType,
  assertMethod,
  readJsonBody,
} from "../_shared/validation.ts";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

type LoginSuccessData = {
  userId: number;
  userName: string;
};

type UserRow = {
  id: number;
  user_name: string;
};

type AuthRow = {
  password: string;
};

function normalizeEmail(value: string | undefined): string {
  return (value ?? "").trim();
}

function normalizePassword(value: string | undefined): string {
  return (value ?? "").trim();
}

async function findUserByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, user_name")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`users の検索に失敗しました: ${error.message}`);
  }

  return (data as UserRow | null) ?? null;
}

async function findAuthByUserId(
  supabase: SupabaseClient,
  userId: number,
): Promise<AuthRow | null> {
  const { data, error } = await supabase
    .from("auth")
    .select("password")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`auth の検索に失敗しました: ${error.message}`);
  }

  return (data as AuthRow | null) ?? null;
}

export async function handleLoginPost(request: Request): Promise<Response> {
  try {
    assertMethod(request, "POST");
    assertApiKey(request);
    assertJsonContentType(request);

    const body = await readJsonBody<LoginRequestBody>(request);
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);

    if (!email) {
      throw new HttpError(400, "email は必須です。");
    }

    if (!password) {
      throw new HttpError(400, "password は必須です。");
    }

    const supabase = createServiceRoleClient();
    const user = await findUserByEmail(supabase, email);

    if (!user) {
      throw new HttpError(401, "email または password が一致しません。");
    }

    const auth = await findAuthByUserId(supabase, user.id);

    if (!auth) {
      throw new HttpError(409, "auth が作成されていません。");
    }

    if (auth.password !== password) {
      throw new HttpError(401, "email または password が一致しません。");
    }

    const data: LoginSuccessData = {
      userId: user.id,
      userName: user.user_name,
    };

    return successResponse("ログインに成功しました。", data);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.errors);
    }

    const message = error instanceof Error
      ? error.message
      : "ログイン処理に失敗しました。";

    return errorResponse(message, 500);
  }
}
