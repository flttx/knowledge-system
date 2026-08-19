import { getApiUser, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { setSuggestionStatus } from "@/lib/services/suggestion-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();
  try {
    const { id } = await context.params;
    return Response.json(await setSuggestionStatus(user.id, id, "rejected"));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
