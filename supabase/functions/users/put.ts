import { createSupabaseClient, jsonResponse } from "./shared.ts";

export async function handlePut(req: Request, cors: HeadersInit) {
  try {
    const supabase = createSupabaseClient();
    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
      return jsonResponse({ message: "id is required" }, 400, cors);
    }

    const id = Number(idParam);
    if (!Number.isInteger(id) || id < 1 || id > 32767) {
      return jsonResponse({ message: "Invalid id" }, 400, cors);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonResponse({ message: "Invalid JSON body" }, 400, cors);
    }

    const updatePayload = {
      user_name: body.user_name,
      email: body.email,
      phone_number: body.phone_number,
      post_number: body.post_number,
      address_1: body.address_1,
      address_2: body.address_2,
      address_3: body.address_3,
      birthdate: body.birthdate,
    };

    const { data, error } = await supabase
      .from("user")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return jsonResponse({ message: error.message }, 500, cors);
    }

    return jsonResponse(data, 200, cors);
  } catch (e) {
    return jsonResponse({ message: String(e) }, 500, cors);
  }
}
