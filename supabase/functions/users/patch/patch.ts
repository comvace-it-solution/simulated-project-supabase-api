/// <reference path="../../_shared/supabase-js-shim.d.ts" />

import { assertApiKey } from "../_shared/auth.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import {
  errorResponse,
  successResponse,
} from "../_shared/response.ts";
import {
  HttpError,
  assertAllowedBodyKeys,
  assertJsonContentType,
  assertMethod,
  parsePositiveInt,
  readJsonBody,
} from "../_shared/validation.ts";

type UpdateUserRequestBody = {
  userName?: string;
  password?: string;
  email?: string;
  phoneNumber?: string;
  postalCode?: string;
  prefecture?: string;
  streetAddress?: string;
  buildingName?: string;
  birthDate?: string;
  assignmentDate?: string;
};

type UpdateUserData = {
  userId: number;
};

function normalizeString(value: string | undefined): string {
  return (value ?? "").trim();
}

function validateRequired(
  value: string | undefined,
  fieldName: string,
): string {
  const normalized = normalizeString(value);

  if (!normalized) {
    throw new HttpError(400, `${fieldName} は必須です。`);
  }

  return normalized;
}

function validateEmail(email: string): string {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "email が不正です。");
  }

  return email;
}

function validatePhoneNumber(phoneNumber: string): string {
  if (!/^[0-9]{11}$/.test(phoneNumber)) {
    throw new HttpError(400, "phoneNumber が不正です。");
  }

  return phoneNumber;
}

function validatePostalCode(postalCode: string): string {
  if (!/^[0-9]{7}$/.test(postalCode)) {
    throw new HttpError(400, "postalCode が不正です。");
  }

  return postalCode;
}

function validatePassword(password: string): string {
  if (!/^[A-Za-z0-9]{6}$/.test(password)) {
    throw new HttpError(
      400,
      "password は半角英数字6文字で入力してください。",
    );
  }

  return password;
}

function validateDate(value: string, fieldName: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${fieldName} が不正です。`);
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${fieldName} が不正です。`);
  }

  return value;
}

async function ensureUserExists(userId: number): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`users の検索に失敗しました: ${error.message}`);
  }

  if (!data) {
    throw new HttpError(404, "ユーザーが存在しません。");
  }
}

export async function handleUsersPatch(
  request: Request,
  userIdSegment: string,
): Promise<Response> {
  try {
    assertMethod(request, "PATCH");
    assertApiKey(request);
    assertJsonContentType(request);

    const userId = parsePositiveInt(userIdSegment, "userId");
    const body = await readJsonBody<UpdateUserRequestBody>(request);
    assertAllowedBodyKeys(body, [
      "userName",
      "password",
      "email",
      "phoneNumber",
      "postalCode",
      "prefecture",
      "streetAddress",
      "buildingName",
      "birthDate",
      "assignmentDate",
    ]);

    const userName = validateRequired(body.userName, "userName");
    const password = normalizeString(body.password);
    const email = validateEmail(validateRequired(body.email, "email"));
    const phoneNumber = validatePhoneNumber(
      validateRequired(body.phoneNumber, "phoneNumber"),
    );
    const postalCode = validatePostalCode(
      validateRequired(body.postalCode, "postalCode"),
    );
    const prefecture = validateRequired(body.prefecture, "prefecture");
    const streetAddress = validateRequired(body.streetAddress, "streetAddress");
    const buildingName = normalizeString(body.buildingName);
    const birthDate = validateDate(
      validateRequired(body.birthDate, "birthDate"),
      "birthDate",
    );
    const assignmentDate = validateDate(
      validateRequired(body.assignmentDate, "assignmentDate"),
      "assignmentDate",
    );

    if (password) {
      validatePassword(password);
    }

    await ensureUserExists(userId);
    const supabase = createServiceRoleClient();

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        user_name: userName,
        email,
        phone_number: phoneNumber,
        postal_code: postalCode,
        prefecture,
        street_address: streetAddress,
        building_name: buildingName || null,
        birth_date: birthDate,
        assignment_date: assignmentDate,
      })
      .eq("id", userId);

    if (updateUserError) {
      if (updateUserError.code === "23505") {
        throw new HttpError(409, "email はすでに登録されています。");
      }

      throw new Error(`users の更新に失敗しました: ${updateUserError.message}`);
    }

    if (password) {
      const { error: updateAuthError } = await supabase
        .from("auth")
        .update({
          password,
        })
        .eq("user_id", userId);

      if (updateAuthError) {
        throw new Error(`auth の更新に失敗しました: ${updateAuthError.message}`);
      }
    }

    const responseData: UpdateUserData = {
      userId,
    };

    return successResponse("従業員情報を更新しました。", responseData);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status);
    }

    const message = error instanceof Error
      ? error.message
      : "従業員情報の更新に失敗しました。";

    return errorResponse(message, 500);
  }
}
