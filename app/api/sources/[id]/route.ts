import { getApiUser, readJson, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import {
  archiveSource,
  getSource,
  updateSource,
} from "@/lib/services/source-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(await getSource(user.id, id));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(await updateSource(user.id, id, await readJson(request)));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(await archiveSource(user.id, id));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
