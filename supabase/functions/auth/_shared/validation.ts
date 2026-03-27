export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function assertMethod(request: Request, allowedMethod: string): void {
  if (request.method !== allowedMethod) {
    throw new HttpError(405, "許可されていないHTTPメソッドです。");
  }
}

export function assertJsonContentType(request: Request): void {
  const contentType = request.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    throw new HttpError(
      400,
      "Content-Type は application/json を指定してください。",
    );
  }
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json() as T;
  } catch {
    throw new HttpError(400, "リクエストボディが不正です。");
  }
}

export function assertAllowedBodyKeys(
  body: unknown,
  allowedKeys: readonly string[],
): void {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "リクエストボディが不正です。");
  }

  const invalidKeys = Object.keys(body).filter((key) => !allowedKeys.includes(key));

  if (invalidKeys.length > 0) {
    throw new HttpError(
      400,
      "リクエストボディに許可されていない項目が含まれています。",
    );
  }
}

export function getRouteSegments(url: string, functionName: string): string[] {
  const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  const segments = pathname.split("/").filter(Boolean);
  const functionIndex = segments.indexOf(functionName);

  if (functionIndex === -1) {
    return segments;
  }

  return segments.slice(functionIndex + 1);
}
