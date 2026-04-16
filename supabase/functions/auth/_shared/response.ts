export type SuccessResponse<T> = {
  result: "success";
  message: string;
  data: T;
};

export type ErrorResponse = {
  result: "error";
  message: string;
};

const BASE_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function buildCorsHeaders(
  extraHeaders?: Record<string, string>,
): HeadersInit {
  return {
    ...BASE_CORS_HEADERS,
    ...extraHeaders,
  };
}

export function successResponse<T>(
  message: string,
  data: T,
  status = 200,
): Response {
  const body: SuccessResponse<T> = {
    result: "success",
    message,
    data,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: buildCorsHeaders({
      "Content-Type": "application/json; charset=utf-8",
    }),
  });
}

export function errorResponse(
  message: string,
  status = 400,
): Response {
  const body: ErrorResponse = {
    result: "error",
    message,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: buildCorsHeaders({
      "Content-Type": "application/json; charset=utf-8",
    }),
  });
}

export function optionsResponse(): Response {
  return new Response("ok", {
    status: 200,
    headers: buildCorsHeaders(),
  });
}
