import {
  createTag,
  listTags,
} from "@/lib/services/note-service";
import {
  getApiUser,
  readJson,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { optionalNumber } from "@/lib/api/query";

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    return Response.json(
      {
        items: await listTags(user.id, {
          q: url.searchParams.get("q") ?? undefined,
          limit: optionalNumber(url.searchParams.get("limit")),
        }),
      },
    );
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    return Response.json(await createTag(user.id, await readJson(request)), {
      status: 201,
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
