import { createSupabaseClient, jsonResponse } from "./shared.ts";

export async function handlePost(req: Request, cors: HeadersInit) {
  try {
    const supabase = createSupabaseClient();
    const body = await req.json().catch(() => null);

    if (!body) {
      return jsonResponse({ message: "Invalid JSON body" }, 400, cors);
    }

    const user_name = body.user_name;
    const email = body.email;

    if (typeof user_name !== "string" || user_name.trim() === "") {
      return jsonResponse({ message: "user_name is required" }, 400, cors);
    }

    if (typeof email !== "string" || email.trim() === "") {
      return jsonResponse({ message: "email is required" }, 400, cors);
    }

    const now = new Date().toISOString();
    const insertPayload = {
      user_name: user_name.trim(),
      email: email.trim(),
      phone_number: body.phone_number ?? null,
      post_number: body.post_number ?? null,
      address_1: body.address_1 ?? null,
      address_2: body.address_2 ?? null,
      address_3: body.address_3 ?? null,
      birthdate: body.birthdate ?? null,
      created_at: now,
      update_at: now,
    };

    const { data, error } = await supabase
      .from("user")
      .insert(insertPayload)
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
