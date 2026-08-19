import { getCurrentUser } from "@/lib/auth/server";
import { ServiceError } from "@/lib/services/errors";

export async function getApiUser() {
  return getCurrentUser();
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: { code: "UNAUTHORIZED", message: "需要登录。" } },
    { status: 401 },
  );
}

export function serviceErrorResponse(error: unknown): Response {
  if (error instanceof ServiceError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  console.error("[api] unhandled service error", {
    name: error instanceof Error ? error.name : "UnknownError",
  });

  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "服务器暂时无法处理请求。" } },
    { status: 500 },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function serializeDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}
