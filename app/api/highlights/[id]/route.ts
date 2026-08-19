import { getApiUser, readJson, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import {
  archiveHighlight,
  getHighlight,
  updateHighlight,
} from "@/lib/services/highlight-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(await getHighlight(user.id, id));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(await updateHighlight(user.id, id, await readJson(request)));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(await archiveHighlight(user.id, id));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
