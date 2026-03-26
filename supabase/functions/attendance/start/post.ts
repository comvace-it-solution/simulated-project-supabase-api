import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { assertApiKey } from "../_shared/auth.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import { getCurrentDateString, getCurrentTimestamp } from "../_shared/date.ts";
import {
  errorResponse,
  successResponse,
} from "../_shared/response.ts";
import {
  HttpError,
  assertJsonContentType,
  assertMethod,
  parsePositiveInt,
  readJsonBody,
} from "../_shared/validation.ts";

type StartRequestBody = {
  userId?: number | string;
};

type UserStateRow = {
  id: number;
  current_attendance_state: number | null;
  current_attendance_id: number | null;
};

type AttendanceInsertRow = {
  id: number;
  user_id: number;
  work_date: string;
  work_start_dt: string;
  work_end_dt: string | null;
};

async function findUserState(
  supabase: SupabaseClient,
  userId: number,
): Promise<UserStateRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, current_attendance_state, current_attendance_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`users の検索に失敗しました: ${error.message}`);
  }

  return (data as UserStateRow | null) ?? null;
}

async function findActiveAttendances(
  supabase: SupabaseClient,
  userId: number,
): Promise<AttendanceInsertRow[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, user_id, work_date, work_start_dt, work_end_dt")
    .eq("user_id", userId)
    .is("work_end_dt", null);

  if (error) {
    throw new Error(`attendance の検索に失敗しました: ${error.message}`);
  }

  return (data ?? []) as AttendanceInsertRow[];
}

export async function handleAttendanceStartPost(
  request: Request,
): Promise<Response> {
  try {
    assertMethod(request, "POST");
    assertApiKey(request);
    assertJsonContentType(request);

    const body = await readJsonBody<StartRequestBody>(request);
    const userId = parsePositiveInt(
      body.userId === undefined ? undefined : String(body.userId),
      "userId",
      "userId は必須です。",
    );

    const supabase = createServiceRoleClient();
    const user = await findUserState(supabase, userId);

    if (!user) {
      throw new HttpError(404, "ユーザーが存在しません。");
    }

    if (user.current_attendance_state === 1) {
      throw new HttpError(409, "すでに勤務中です。");
    }

    if (user.current_attendance_state === 2) {
      throw new HttpError(409, "すでに休憩中です。");
    }

    const activeAttendances = await findActiveAttendances(supabase, userId);

    if (activeAttendances.length > 0) {
      throw new HttpError(409, "進行中勤務がすでに存在します。");
    }

    const now = getCurrentTimestamp();
    const workDate = getCurrentDateString();

    const { data: insertedAttendance, error: insertError } = await supabase
      .from("attendance")
      .insert({
        user_id: userId,
        work_date: workDate,
        work_start_dt: now,
      })
      .select("id, user_id, work_date, work_start_dt, work_end_dt")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        throw new HttpError(409, "進行中勤務がすでに存在します。");
      }

      throw new Error(`attendance の作成に失敗しました: ${insertError.message}`);
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        current_attendance_state: 1,
        current_attendance_id: (insertedAttendance as AttendanceInsertRow).id,
      })
      .eq("id", userId);

    if (updateUserError) {
      await supabase
        .from("attendance")
        .delete()
        .eq("id", (insertedAttendance as AttendanceInsertRow).id);

      throw new Error(`users の更新に失敗しました: ${updateUserError.message}`);
    }

    const createdAttendance = insertedAttendance as AttendanceInsertRow;

    return successResponse("勤務開始に成功しました。", {
      attendanceId: createdAttendance.id,
      userId,
      workDate: createdAttendance.work_date,
      workStartDt: createdAttendance.work_start_dt,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.errors);
    }

    const message = error instanceof Error
      ? error.message
      : "勤務開始処理に失敗しました。";

    return errorResponse(message, 500);
  }
}
