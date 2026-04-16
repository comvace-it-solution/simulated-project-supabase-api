/// <reference path="../../_shared/supabase-js-shim.d.ts" />

import { assertApiKey } from "../_shared/auth.ts";
import { createServiceRoleClient } from "../_shared/client.ts";
import {
  errorResponse,
  successResponse,
} from "../_shared/response.ts";
import {
  HttpError,
  assertMethod,
  parsePositiveInt,
} from "../_shared/validation.ts";

type DeleteUserData = {
  userId: number;
};

type AttendanceRow = {
  id: number;
};

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

async function findAttendanceIds(userId: number): Promise<number[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`attendance の検索に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as AttendanceRow[]).map((attendance) => attendance.id);
}

export async function handleUsersDelete(
  request: Request,
  userIdSegment: string,
): Promise<Response> {
  try {
    assertMethod(request, "DELETE");
    assertApiKey(request);

    const userId = parsePositiveInt(userIdSegment, "userId");
    await ensureUserExists(userId);

    const supabase = createServiceRoleClient();
    const attendanceIds = await findAttendanceIds(userId);

    const { error: clearCurrentAttendanceError } = await supabase
      .from("users")
      .update({
        current_attendance_state: null,
        current_attendance_id: null,
      })
      .eq("id", userId);

    if (clearCurrentAttendanceError) {
      throw new Error(
        `users.current_attendance の解除に失敗しました: ${clearCurrentAttendanceError.message}`,
      );
    }

    if (attendanceIds.length > 0) {
      const { error: deleteBreaksError } = await supabase
        .from("attendance_breaks")
        .delete()
        .in("attendance_id", attendanceIds);

      if (deleteBreaksError) {
        throw new Error(
          `attendance_breaks の削除に失敗しました: ${deleteBreaksError.message}`,
        );
      }
    }

    const { error: deleteAttendanceError } = await supabase
      .from("attendance")
      .delete()
      .eq("user_id", userId);

    if (deleteAttendanceError) {
      throw new Error(
        `attendance の削除に失敗しました: ${deleteAttendanceError.message}`,
      );
    }

    const { error: deleteAuthError } = await supabase
      .from("auth")
      .delete()
      .eq("user_id", userId);

    if (deleteAuthError) {
      throw new Error(`auth の削除に失敗しました: ${deleteAuthError.message}`);
    }

    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteUserError) {
      throw new Error(`users の削除に失敗しました: ${deleteUserError.message}`);
    }

    const responseData: DeleteUserData = {
      userId,
    };

    return successResponse("従業員を削除しました。", responseData);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status);
    }

    const message = error instanceof Error
      ? error.message
      : "従業員の削除に失敗しました。";

    return errorResponse(message, 500);
  }
}
