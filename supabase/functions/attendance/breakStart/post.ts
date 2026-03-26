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

type BreakStartRequestBody = {
  userId?: number | string;
};

type UserStateRow = {
  id: number;
  current_attendance_state: number | null;
  current_attendance_id: number | null;
};

type AttendanceRow = {
  id: number;
  user_id: number;
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

async function findAttendance(
  supabase: SupabaseClient,
  attendanceId: number,
): Promise<AttendanceRow | null> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, user_id")
    .eq("id", attendanceId)
    .maybeSingle();

  if (error) {
    throw new Error(`attendance の検索に失敗しました: ${error.message}`);
  }

  return (data as AttendanceRow | null) ?? null;
}

async function findActiveBreaks(
  supabase: SupabaseClient,
  attendanceId: number,
): Promise<AttendanceBreakRow[]> {
  const { data, error } = await supabase
    .from("attendance_breaks")
    .select("id, attendance_id, break_start_dt, break_end_dt")
    .eq("attendance_id", attendanceId)
    .is("break_end_dt", null);

  if (error) {
    throw new Error(`attendance_breaks の検索に失敗しました: ${error.message}`);
  }

  return (data ?? []) as AttendanceBreakRow[];
}

export async function handleAttendanceBreakStartPost(
  request: Request,
): Promise<Response> {
  try {
    assertMethod(request, "POST");
    assertApiKey(request);
    assertJsonContentType(request);

    const body = await readJsonBody<BreakStartRequestBody>(request);
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

    if (user.current_attendance_state === null) {
      throw new HttpError(409, "非勤務中のため休憩開始できません。");
    }

    if (user.current_attendance_state === 2) {
      throw new HttpError(409, "すでに休憩中です。");
    }

    if (!user.current_attendance_id) {
      throw new HttpError(409, "current_attendance_id が設定されていません。");
    }

    const attendance = await findAttendance(supabase, user.current_attendance_id);

    if (!attendance || attendance.user_id !== userId) {
      throw new HttpError(409, "勤務レコードが不整合です。");
    }

    const activeBreaks = await findActiveBreaks(supabase, attendance.id);

    if (activeBreaks.length > 0) {
      throw new HttpError(409, "未終了の休憩が存在します。");
    }

    const now = getCurrentTimestamp();

    const { data: insertedBreak, error: insertError } = await supabase
      .from("attendance_breaks")
      .insert({
        attendance_id: attendance.id,
        break_start_dt: now,
      })
      .select("id, attendance_id, break_start_dt, break_end_dt")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        throw new HttpError(409, "未終了の休憩が存在します。");
      }

      throw new Error(
        `attendance_breaks の作成に失敗しました: ${insertError.message}`,
      );
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        current_attendance_state: 2,
      })
      .eq("id", userId);

    if (updateUserError) {
      await supabase
        .from("attendance_breaks")
        .delete()
        .eq("id", (insertedBreak as AttendanceBreakRow).id);

      throw new Error(`users の更新に失敗しました: ${updateUserError.message}`);
    }

    const createdBreak = insertedBreak as AttendanceBreakRow;

    return successResponse("休憩開始に成功しました。", {
      attendanceId: attendance.id,
      breakId: createdBreak.id,
      breakStartDt: createdBreak.break_start_dt,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.errors);
    }

    const message = error instanceof Error
      ? error.message
      : "休憩開始処理に失敗しました。";

    return errorResponse(message, 500);
  }
}
