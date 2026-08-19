import { getLocalAgentUser } from "@/lib/auth/local-agent";
import { readJson, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { importSuggestions } from "@/lib/services/suggestion-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getLocalAgentUser(request);
    if (!user) return unauthorizedResponse();
    return Response.json(await importSuggestions(user.id, await readJson(request)));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
