import { detachTag } from "@/lib/services/note-service";
import {
  getApiUser,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { serializeNote } from "@/lib/api/note-serializers";

interface RouteContext {
  params: Promise<{ id: string; tagId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id, tagId } = await context.params;
    return Response.json(serializeNote(await detachTag(user.id, id, tagId)));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
