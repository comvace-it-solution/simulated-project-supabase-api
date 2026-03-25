/// <reference path="./jsr-shims.d.ts" />
/// <reference path="../deno-globals.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleDelete } from "./delete.ts";
import { handleGet } from "./get.ts";
import { handlePost } from "./post.ts";
import { handlePut } from "./put.ts";
import { corsHeaders, jsonResponse } from "./shared.ts";

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
    return jsonResponse({ message: "Method Not Allowed" }, 405, cors);
  }

  if (req.method === "PUT") {
    return handlePut(req, cors);
  }

  if (req.method === "DELETE") {
    return handleDelete(req, cors);
  }

  if (req.method === "POST") {
    return handlePost(req, cors);
  }

  return handleGet(req, cors);
});
