/// <reference path="../../_shared/supabase-js-shim.d.ts" />

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { assertApiKey } from "../_shared/auth.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import { getCurrentTimestamp } from "../_shared/date.ts";
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

type BreakEndRequestBody = {
  userId?: number | string;
};

type UserStateRow = {
  id: number;
  current_attendance_state: number | null;
  current_attendance_id: number | null;
};

type AttendanceBreakRow = {
  id: number;
  attendance_id: number;
  break_start_dt: string;
  break_end_dt: string | null;
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

async function findActiveBreaks(
  supabase: SupabaseClient,
  attendanceId: number,
): Promise<AttendanceBreakRow[]> {
  const { data, error } = await supabase
    .from("attendance_breaks")
    .select("id, attendance_id, break_start_dt, break_end_dt")
    .eq("attendance_id", attendanceId)
    .is("break_end_dt", null)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`attendance_breaks の検索に失敗しました: ${error.message}`);
  }

  return (data ?? []) as AttendanceBreakRow[];
}

export async function handleAttendanceBreakEndPost(
  request: Request,
): Promise<Response> {
  try {
    assertMethod(request, "POST");
    assertApiKey(request);
    assertJsonContentType(request);

    const body = await readJsonBody<BreakEndRequestBody>(request);
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

    if (user.current_attendance_state !== 2) {
      throw new HttpError(409, "休憩中ではありません。");
    }

    if (!user.current_attendance_id) {
      throw new HttpError(409, "current_attendance_id が設定されていません。");
    }

    const activeBreaks = await findActiveBreaks(supabase, user.current_attendance_id);

    if (activeBreaks.length === 0) {
      throw new HttpError(409, "未終了の休憩が存在しません。");
    }

    if (activeBreaks.length > 1) {
      throw new HttpError(409, "未終了の休憩が複数存在します。");
    }

    const activeBreak = activeBreaks[0];
    const now = getCurrentTimestamp();

    const { error: updateBreakError } = await supabase
      .from("attendance_breaks")
      .update({
        break_end_dt: now,
      })
      .eq("id", activeBreak.id);

    if (updateBreakError) {
      throw new Error(
        `attendance_breaks の更新に失敗しました: ${updateBreakError.message}`,
      );
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        current_attendance_state: 1,
      })
      .eq("id", userId);

    if (updateUserError) {
      await supabase
        .from("attendance_breaks")
        .update({
          break_end_dt: null,
        })
        .eq("id", activeBreak.id);

      throw new Error(`users の更新に失敗しました: ${updateUserError.message}`);
    }

    return successResponse("休憩終了に成功しました。", {
      attendanceId: user.current_attendance_id,
      breakId: activeBreak.id,
      breakEndDt: now,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.errors);
    }

    const message = error instanceof Error
      ? error.message
      : "休憩終了処理に失敗しました。";

    return errorResponse(message, 500);
  }
}
