import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
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

type UserResponseData = {
  id: number;
  userName: string;
  email: string;
  phoneNumber: string | null;
  postalCode: string | null;
  prefecture: string | null;
  streetAddress: string | null;
  buildingName: string | null;
  birthDate: string | null;
  assignmentDate: string;
  currentAttendanceState: number | null;
  currentAttendanceId: number | null;
};

type UserRow = {
  id: number;
  userName: string;
  email: string;
  phoneNumber: string | null;
  postalCode: string | null;
  prefecture: string | null;
  streetAddress: string | null;
  buildingName: string | null;
  birthDate: string | null;
  assignmentDate: string;
  currentAttendanceState: number | null;
  currentAttendanceId: number | null;
};

async function findUserById(
  supabase: SupabaseClient,
  userId: number,
): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      userName:user_name,
      email,
      phoneNumber:phone_number,
      postalCode:postal_code,
      prefecture,
      streetAddress:street_address,
      buildingName:building_name,
      birthDate:birth_date,
      assignmentDate:assignment_date,
      currentAttendanceState:current_attendance_state,
      currentAttendanceId:current_attendance_id
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`users の検索に失敗しました: ${error.message}`);
  }

  return (data as UserRow | null) ?? null;
}

export async function handleUsersGet(
  request: Request,
  userIdSegment: string | undefined,
): Promise<Response> {
  try {
    assertMethod(request, "GET");
    assertApiKey(request);

    const userId = parsePositiveInt(userIdSegment, "userId");
    const supabase = createServiceRoleClient();
    const user = await findUserById(supabase, userId);

    if (!user) {
      throw new HttpError(404, "ユーザーが存在しません。");
    }

    const responseData: UserResponseData = {
      id: user.id,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      postalCode: user.postalCode,
      prefecture: user.prefecture,
      streetAddress: user.streetAddress,
      buildingName: user.buildingName,
      birthDate: user.birthDate,
      assignmentDate: user.assignmentDate,
      currentAttendanceState: user.currentAttendanceState,
      currentAttendanceId: user.currentAttendanceId,
    };

    return successResponse("ユーザー情報を取得しました。", responseData);
  } catch (error) {
    if (error instanceof HttpError) {
      return errorResponse(error.message, error.status, error.errors);
    }

    const message = error instanceof Error
      ? error.message
      : "ユーザー情報の取得に失敗しました。";

    return errorResponse(message, 500);
  }
}
