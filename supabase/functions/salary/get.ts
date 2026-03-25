import { createSupabaseClient, jsonResponse } from "./shared.ts";

export async function handleGet(req: Request, cors: HeadersInit) {
  try {
    const supabase = createSupabaseClient();
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("user_id");

    let query = supabase
      .from("salary")
      .select("*")
      .order("id", { ascending: true });

    if (userIdParam !== null) {
      if (userIdParam.trim() === "") {
        return jsonResponse({ message: "Invalid user_id parameter" }, 400, cors);
      }

      const userId = Number(userIdParam);
      const isInt = Number.isInteger(userId);
      const inRange = userId >= 1 && userId <= 32767;

      if (!isInt || !inRange) {
        return jsonResponse({ message: "Invalid user_id parameter" }, 400, cors);
      }

      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      return jsonResponse({ message: error.message }, 500, cors);
    }

    return jsonResponse(data ?? [], 200, cors);
  } catch (e) {
    return jsonResponse({ message: String(e) }, 500, cors);
  }
}
