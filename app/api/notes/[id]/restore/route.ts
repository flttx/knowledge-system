import { restoreNote } from "@/lib/services/note-service";
import {
  getApiUser,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { serializeNote } from "@/lib/api/note-serializers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(serializeNote(await restoreNote(user.id, id)));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
