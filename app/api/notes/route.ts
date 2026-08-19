import {
  getApiUser,
  readJson,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { optionalBoolean, optionalNumber } from "@/lib/api/query";
import { serializeNote, serializeNoteSummary } from "@/lib/api/note-serializers";
import { createNote, listNotes } from "@/lib/services/note-service";

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const page = await listNotes(user.id, {
        cursor: url.searchParams.get("cursor") ?? undefined,
        limit: optionalNumber(url.searchParams.get("limit")),
        tag: url.searchParams.get("tag") ?? undefined,
        archived: optionalBoolean(url.searchParams.get("archived")),
        q: url.searchParams.get("q") ?? undefined,
      });
    return Response.json({
      ...page,
      items: page.items.map(serializeNoteSummary),
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    return Response.json(serializeNote(await createNote(user.id, await readJson(request))), {
      status: 201,
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
