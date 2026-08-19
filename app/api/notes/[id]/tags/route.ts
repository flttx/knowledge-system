import {
  attachTag,
  getNote,
} from "@/lib/services/note-service";
import {
  getApiUser,
  readJson,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { serializeNote } from "@/lib/api/note-serializers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(serializeNote(await attachTag(user.id, id, await readJson(request))), {
      status: 201,
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    return Response.json(serializeNote(await getNote(user.id, id)));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
