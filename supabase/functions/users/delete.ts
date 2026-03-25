import { createSupabaseClient, jsonResponse } from "./shared.ts";

export async function handleDelete(req: Request, cors: HeadersInit) {
  try {
    const supabase = createSupabaseClient();
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
      return jsonResponse({ message: "id is required" }, 400, cors);
    }

    const id = Number(idParam);
    if (!Number.isInteger(id) || id < 1) {
      return jsonResponse({ message: "Invalid id" }, 400, cors);
    }

    const { error } = await supabase.from("user").delete().eq("id", id);

    if (error) {
      return jsonResponse({ message: error.message }, 500, cors);
    }

    return new Response(null, { status: 204, headers: cors });
  } catch (e) {
    return jsonResponse({ message: String(e) }, 500, cors);
  }
}
