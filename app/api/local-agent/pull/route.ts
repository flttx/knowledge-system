import { getLocalAgentUser } from "@/lib/auth/local-agent";
import { readJson, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import {
  localAgentPullRequestSchema,
  type LocalAgentPullResponse,
} from "@/lib/local-agent/types";
import { pullKnowledge } from "@/lib/services/local-agent-pull-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getLocalAgentUser(request);
    if (!user) return unauthorizedResponse();

    const parsed = localAgentPullRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid pull scope." } },
        { status: 400 },
      );
    }

    const response: LocalAgentPullResponse = await pullKnowledge(
      user.id,
      parsed.data.scope,
    );
    return Response.json(response);
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
