export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: ApiError;
};

export function ok<T>(data: T): ApiEnvelope<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string, details?: unknown): ApiEnvelope<never> {
  return { ok: false, error: { code, message, details } };
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Body must be an object");
    }
    return body as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON body");
  }
}
