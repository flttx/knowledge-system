import { getApiUser } from "@/lib/api/response";
import { readJson, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { acceptSuggestion } from "@/lib/services/suggestion-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await getApiUser();
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    return Response.json(await acceptSuggestion(user.id, id, await readJson(request)));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
