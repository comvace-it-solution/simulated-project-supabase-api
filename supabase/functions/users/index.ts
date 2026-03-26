import { errorResponse, optionsResponse } from "./_shared/response.ts";
import { getRouteSegments } from "./_shared/validation.ts";
import { handleUsersGet } from "./get/get.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  const segments = getRouteSegments(request.url, "users");

  if (segments.length === 1) {
    return await handleUsersGet(request, segments[0]);
  }

  return errorResponse("対象のエンドポイントが存在しません。", 404);
});
