/// <reference path="../_shared/deno-globals.d.ts" />

import { handleLoginPost } from "./login/post.ts";
import { optionsResponse, errorResponse } from "./_shared/response.ts";
import { getRouteSegments } from "./_shared/validation.ts";

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  const segments = getRouteSegments(request.url, "auth");

  if (segments.length === 1 && segments[0] === "login") {
    return await handleLoginPost(request);
  }

  return errorResponse("対象のエンドポイントが存在しません。", 404);
});
