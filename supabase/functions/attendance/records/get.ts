/// <reference path="../../_shared/supabase-js-shim.d.ts" />

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { assertApiKey } from "../_shared/auth.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import { getMonthRange, validateTargetMonth } from "../_shared/date.ts";
import {
  errorResponse,
  successResponse,
} from "../_shared/response.ts";
import {
  HttpError,
  assertMethod,
  getRequiredQueryParam,
  parsePositiveInt,
} from "../_shared/validation.ts";

type UserExistsRow = {
  id: number;
};

type AttendanceRow = {
  id: number;
  work_date: string;
  work_start_dt: string;
  work_end_dt: string | null;
};

type AttendanceBreakRow = {
  id: number;
  attendance_id: number;
  break_start_dt: string;
  break_end_dt: string | null;
};

type AttendanceRecord = {
  id: number;
  workDate: string;
  workStartDt: string;
  workEndDt: string | null;
  breaks: {
    id: number;
    breakStartDt: string;
    breakEndDt: string | null;
  }[];
};

async function findUser(
  supabase: SupabaseClient,
  userId: number,
): Promise<UserExistsRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`users の検索に失敗しました: ${error.message}`);
  }

  return (data as UserExistsRow | null) ?? null;
}

async function findAttendances(
  supabase: SupabaseClient,
  userId: number,
  fromDate: string,
  toDateExclusive: string,
): Promise<AttendanceRow[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, work_date, work_start_dt, work_end_dt")
    .eq("user_id", userId)
    .gte("work_date", fromDate)
    .lt("work_date", toDateExclusive)
    .order("work_date", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`attendance の検索に失敗しました: ${error.message}`);
  }

  return (data ?? []) as AttendanceRow[];
}

async function findAttendanceBreaks(
  supabase: SupabaseClient,
  attendanceIds: number[],
): Promise<AttendanceBreakRow[]> {
  if (attendanceIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("attendance_breaks")
    .select("id, attendance_id, break_start_dt, break_end_dt")
    .in("attendance_id", attendanceIds)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`attendance_breaks の検索に失敗しました: ${error.message}`);
  }

  return (data ?? []) as AttendanceBreakRow[];
}

export async function handleAttendanceRecordsGet(
  request: Request,
): Promise<Response> {
  try {
    assertMethod(request, "GET");
    assertApiKey(request);

    const userIdText = getRequiredQueryParam(
      request.url,
      "userId",
      "userId は必須です。",
    );
    const targetMonthText = getRequiredQueryParam(
      request.url,
      "targetMonth",
      "targetMonth は必須です。",
    );

    const userId = parsePositiveInt(userIdText, "userId");
    const targetMonth = validateTargetMonth(targetMonthText);
    const { fromDate, toDateExclusive } = getMonthRange(targetMonth);
    const supabase = createServiceRoleClient();

    const user = await findUser(supabase, userId);

    if (!user) {
      throw new HttpError(404, "ユーザーが存在しません。");
    }

    const attendances = await findAttendances(
      supabase,
      userId,
      fromDate,
      toDateExclusive,
    );
    const attendanceIds = attendances.map((attendance: AttendanceRow) =>
      attendance.id
    );
    const attendanceBreaks = await findAttendanceBreaks(supabase, attendanceIds);

    const breaksByAttendanceId = new Map<number, AttendanceBreakRow[]>();

    for (const attendanceBreak of attendanceBreaks) {
      const current = breaksByAttendanceId.get(attendanceBreak.attendance_id) ?? [];
      current.push(attendanceBreak);
      breaksByAttendanceId.set(attendanceBreak.attendance_id, current);
    }

    const attendanceRecords: AttendanceRecord[] = attendances.map((
      attendance: AttendanceRow,
    ) => {
      const breaks = breaksByAttendanceId.get(attendance.id) ?? [];

      return {
        id: attendance.id,
        workDate: attendance.work_date,
        workStartDt: attendance.work_start_dt,
        workEndDt: attendance.work_end_dt,
        breaks: breaks.map((attendanceBreak: AttendanceBreakRow) => ({
          id: attendanceBreak.id,
          breakStartDt: attendanceBreak.break_start_dt,
          breakEndDt: attendanceBreak.break_end_dt,
        })),
      };
    });

    return successResponse("勤怠一覧を取得しました。", {
      userId,
      targetMonth,
      attendanceRecords,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.errors);
    }

    const message = error instanceof Error
      ? error.message
      : "勤怠一覧の取得に失敗しました。";

    return errorResponse(message, 500);
  }
}
