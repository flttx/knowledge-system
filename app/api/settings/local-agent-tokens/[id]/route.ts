import { getApiUser, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { revokeLocalAgentToken } from "@/lib/services/local-agent-token-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await getApiUser();
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    await revokeLocalAgentToken(user.id, id);
    return Response.json({ ok: true });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
