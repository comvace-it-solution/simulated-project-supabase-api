/// <reference path="./jsr-shims.d.ts" />
/// <reference path="../deno-globals.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleGet } from "./get.ts";
import { handlePost } from "./post.ts";
import { corsHeaders, jsonResponse } from "./shared.ts";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ message: "Method Not Allowed" }, 405, cors);
  }

  if (req.method === "POST") {
    return handlePost(req, cors);
  }

  return handleGet(req, cors);
});
