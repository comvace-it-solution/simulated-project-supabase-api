/// <reference path="../_shared/deno-globals.d.ts" />

import { errorResponse, optionsResponse } from "./_shared/response.ts";
import { getRouteSegments } from "./_shared/validation.ts";
import { handleUsersDelete } from "./delete/delete.ts";
import { handleUsersGet } from "./get/get.ts";
import { handleUsersPost } from "./post/post.ts";
import { handleUsersPut } from "./put/put.ts";

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  const segments = getRouteSegments(request.url, "users");

  if (segments.length === 0) {
    if (request.method === "POST") {
      return await handleUsersPost(request);
    }

    return await handleUsersGet(request, undefined);
  }

  if (segments.length === 1) {
    if (request.method === "DELETE") {
      return await handleUsersDelete(request, segments[0]);
    }

    if (request.method === "PUT") {
      return await handleUsersPut(request, segments[0]);
    }

    return await handleUsersGet(request, segments[0]);
  }

  return errorResponse("対象のエンドポイントが存在しません。", 404);
});
