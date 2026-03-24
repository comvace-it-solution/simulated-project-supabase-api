/// <reference path="./jsr-shims.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, X-Client-Info",
    "Access-Control-Max-Age": "86400",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (
    req.method !== "GET" &&
    req.method !== "POST" &&
    req.method !== "DELETE" &&
    req.method !== "PUT"
  ) {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (req.method === "PUT") {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      // queryのidで固定
      const url = new URL(req.url);
      const idParam = url.searchParams.get("id");

      if (!idParam) {
        return new Response(JSON.stringify({ message: "id is required" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const id = Number(idParam);
      if (!Number.isInteger(id) || id < 1 || id > 32767) {
        return new Response(JSON.stringify({ message: "Invalid id" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // bodyの項目（POSTと同じもの）を受ける
      const body = await req.json().catch(() => null);
      if (!body) {
        return new Response(JSON.stringify({ message: "Invalid JSON body" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // body内のidは無視して固定（ここが要件）
      // 必要なら任意で「idを上書き」しないために delete する/しない等
      const {
        user_name,
        email,
        phone_number,
        post_number,
        address_1,
        address_2,
        address_3,
        birthdate,
      } = body;

      const updatePayload: Record<string, unknown> = {
        user_name,
        email,
        phone_number,
        post_number,
        address_1,
        address_2,
        address_3,
        birthdate,
      };

      const { data, error } = await supabase
        .from("user")
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return new Response(JSON.stringify({ message: error.message }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ message: String(e) }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      const url = new URL(req.url);
      const idParam = url.searchParams.get("id");

      if (!idParam) {
        return new Response(JSON.stringify({ message: "id is required" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const id = Number(idParam);
      if (!Number.isInteger(id) || id < 1) {
        return new Response(JSON.stringify({ message: "Invalid id" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase.from("user").delete().eq("id", id);

      if (error) {
        return new Response(JSON.stringify({ message: error.message }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // 204 No Content
      return new Response(null, { status: 204, headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ message: String(e) }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "POST") {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      const body = await req.json().catch(() => null);
      if (!body) {
        return new Response(JSON.stringify({ message: "Invalid JSON body" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // 必須（テーブル定義上 not null）
      const user_name = body.user_name;
      const email = body.email;

      if (typeof user_name !== "string" || user_name.trim() === "") {
        return new Response(
          JSON.stringify({ message: "user_name is required" }),
          {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" },
          },
        );
      }
      if (typeof email !== "string" || email.trim() === "") {
        return new Response(JSON.stringify({ message: "email is required" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
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
        birthdate: body.birthdate ?? null, // "YYYY-MM-DD" を想定
        created_at: now,
        update_at: now,
      };

      const { data, error } = await supabase
        .from("user")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) {
        return new Response(JSON.stringify({ message: error.message }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ message: String(e) }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  // GET
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const url = new URL(req.url);
    const idParam = url.searchParams.get("id");

    let query = supabase
      .from("user")
      .select("*")
      .order("id", { ascending: true });

    if (idParam !== null) {
      if (idParam.trim() === "") {
        return new Response(
          JSON.stringify({ message: "Invalid id parameter" }),
          {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" },
          },
        );
      }

      const id = Number(idParam);
      const isInt = Number.isInteger(id);
      const inRange = id >= 1 && id <= 32767; // smallint想定 + 1以上運用

      if (!isInt || !inRange) {
        return new Response(
          JSON.stringify({ message: "Invalid id parameter" }),
          {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" },
          },
        );
      }

      query = query.eq("id", id);
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data ?? []), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ message: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
