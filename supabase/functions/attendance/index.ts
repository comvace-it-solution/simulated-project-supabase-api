/// <reference path="../_shared/deno-globals.d.ts" />

import { errorResponse, optionsResponse } from "./_shared/response.ts";
import { getRouteSegments } from "./_shared/validation.ts";
import { handleAttendanceBreakEndPost } from "./breakEnd/post.ts";
import { handleAttendanceBreakStartPost } from "./breakStart/post.ts";
import { handleAttendanceEndPost } from "./end/post.ts";
import { handleAttendanceRecordsGet } from "./records/get.ts";
import { handleAttendanceStartPost } from "./start/post.ts";

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  const segments = getRouteSegments(request.url, "attendance");

  if (segments.length === 1 && segments[0] === "start") {
    return await handleAttendanceStartPost(request);
  }

  if (segments.length === 2 && segments[0] === "break" && segments[1] === "start") {
    return await handleAttendanceBreakStartPost(request);
  }

  if (segments.length === 2 && segments[0] === "break" && segments[1] === "end") {
    return await handleAttendanceBreakEndPost(request);
  }

  if (segments.length === 1 && segments[0] === "end") {
    return await handleAttendanceEndPost(request);
  }

  if (segments.length === 1 && segments[0] === "records") {
    return await handleAttendanceRecordsGet(request);
  }

  return errorResponse("対象のエンドポイントが存在しません。", 404);
});
