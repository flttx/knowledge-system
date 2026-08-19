import { getLocalAgentUser } from "@/lib/auth/local-agent";
import { serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import {
  localAgentScopes,
  type LocalAgentStatusResponse,
} from "@/lib/local-agent/types";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getLocalAgentUser(request);
    if (!user) return unauthorizedResponse();

    const response: LocalAgentStatusResponse = {
      version: 1,
      authenticated: true,
      scopes: [...localAgentScopes],
    };
    return Response.json(response);
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
