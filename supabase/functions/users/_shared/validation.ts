export class HttpError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(status: number, message: string, errors: string[] = []) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.errors = errors;
  }
}

export function assertMethod(request: Request, allowedMethod: string): void {
  if (request.method !== allowedMethod) {
    throw new HttpError(405, "許可されていないHTTPメソッドです。");
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

export function parsePositiveInt(
  value: string | undefined,
  fieldName: string,
): number {
  const normalized = (value ?? "").trim();

  if (!/^[1-9][0-9]*$/.test(normalized)) {
    throw new HttpError(400, `${fieldName} が不正です。`);
  }

  return Number(normalized);
}
