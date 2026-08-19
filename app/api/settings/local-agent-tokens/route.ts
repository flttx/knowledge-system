import { getApiUser, readJson, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import {
  createLocalAgentToken,
  listLocalAgentTokens,
} from "@/lib/services/local-agent-token-service";

function serializeToken(value: Awaited<ReturnType<typeof listLocalAgentTokens>>[number]) {
  return {
    ...value,
    createdAt: value.createdAt.toISOString(),
    lastUsedAt: value.lastUsedAt?.toISOString() ?? null,
    expiresAt: value.expiresAt?.toISOString() ?? null,
    revokedAt: value.revokedAt?.toISOString() ?? null,
  };
}

export async function GET(): Promise<Response> {
  try {
    const user = await getApiUser();
    if (!user) return unauthorizedResponse();
    return Response.json({ items: (await listLocalAgentTokens(user.id)).map(serializeToken) });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getApiUser();
    if (!user) return unauthorizedResponse();
    const body = await readJson(request);
    const name =
      typeof body === "object" && body !== null && "name" in body && typeof body.name === "string"
        ? body.name
        : "";
    const created = await createLocalAgentToken(user.id, name);
    return Response.json(
      {
        token: created.token,
        item: serializeToken(created),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
