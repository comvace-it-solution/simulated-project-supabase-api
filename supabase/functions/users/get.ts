import { createSupabaseClient, jsonResponse } from "./shared.ts";

export async function handleGet(req, cors) {
  try {
    const supabase = createSupabaseClient();
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");

    let query = supabase
      .from("user")
      .select("*")
      .order("id", { ascending: true });

    if (idParam !== null) {
      if (idParam.trim() === "") {
        return jsonResponse({ message: "Invalid id parameter" }, 400, cors);
      }

      const id = Number(idParam);
      const isInt = Number.isInteger(id);
      const inRange = id >= 1 && id <= 32767;

      if (!isInt || !inRange) {
        return jsonResponse({ message: "Invalid id parameter" }, 400, cors);
      }

      query = query.eq("id", id);
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
