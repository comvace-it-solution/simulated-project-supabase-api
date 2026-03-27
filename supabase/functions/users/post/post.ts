/// <reference path="../../_shared/supabase-js-shim.d.ts" />

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
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
  readJsonBody,
} from "../_shared/validation.ts";

type CreateUserRequestBody = {
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

type CreateUserData = {
  userId: number;
};

type UserInsertRow = {
  id: number;
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

export async function handleUsersPost(request: Request): Promise<Response> {
  try {
    assertMethod(request, "POST");
    assertApiKey(request);
    assertJsonContentType(request);

    const body = await readJsonBody<CreateUserRequestBody>(request);
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
    const password = validatePassword(validateRequired(body.password, "password"));
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

    const supabase = createServiceRoleClient();
    const { data: insertedUser, error: insertUserError } = await supabase
      .from("users")
      .insert({
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
      .select("id")
      .single();

    if (insertUserError) {
      if (insertUserError.code === "23505") {
        throw new HttpError(409, "email はすでに登録されています。");
      }

      throw new Error(`users の作成に失敗しました: ${insertUserError.message}`);
    }

    const userId = (insertedUser as UserInsertRow).id;
    const { error: insertAuthError } = await supabase
      .from("auth")
      .insert({
        user_id: userId,
        password,
      });

    if (insertAuthError) {
      await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      throw new Error(`auth の作成に失敗しました: ${insertAuthError.message}`);
    }

    const responseData: CreateUserData = {
      userId,
    };

    return successResponse("従業員登録に成功しました。", responseData);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status);
    }

    const message = error instanceof Error
      ? error.message
      : "従業員登録に失敗しました。";

    return errorResponse(message, 500);
  }
}
