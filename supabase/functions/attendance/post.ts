import { createSupabaseClient, jsonResponse } from "./shared.ts";

export async function handlePost(req: Request, cors: HeadersInit) {
  try {
    const supabase = createSupabaseClient();
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonResponse({ message: "Invalid JSON body" }, 400, cors);
    }

    const userId = Number(body.user_id);
    if (!Number.isInteger(userId) || userId < 1 || userId > 32767) {
      return jsonResponse({ message: "Invalid user_id" }, 400, cors);
    }

    const state = body.state;
    if (state !== undefined && state !== null) {
      if (!Number.isInteger(state) || state < 0 || state > 2) {
        return jsonResponse({ message: "Invalid state" }, 400, cors);
      }
    }

    const attendancePayload = {
      user_id: userId,
      work_start_dt: body.work_start_dt ?? null,
      work_end_dt: body.work_end_dt ?? null,
      break_start_dt: body.break_start_dt ?? null,
      break_end_dt: body.break_end_dt ?? null,
      state: state ?? null,
    };

    const { data: existingRows, error: findError } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId);

    if (findError) {
      return jsonResponse({ message: findError.message }, 500, cors);
    }

    if ((existingRows ?? []).length > 0) {
      const { data, error } = await supabase
        .from("attendance")
        .update(attendancePayload)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        return jsonResponse({ message: error.message }, 500, cors);
      }

      return jsonResponse(data, 200, cors);
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert(attendancePayload)
      .select("*")
      .single();

    if (error) {
      return jsonResponse({ message: error.message }, 500, cors);
    }

    return jsonResponse(data, 201, cors);
  } catch (e) {
    return jsonResponse({ message: String(e) }, 500, cors);
  }
}
