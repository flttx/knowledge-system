import { getApiUser, readJson, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { optionalEnum, optionalNumber } from "@/lib/api/query";
import { createHighlight, listHighlights } from "@/lib/services/highlight-service";
import { inboxStatuses } from "@/lib/services/validation";

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    return Response.json(
      await listHighlights(user.id, {
        cursor: url.searchParams.get("cursor") ?? undefined,
        limit: optionalNumber(url.searchParams.get("limit")),
        status: optionalEnum(url.searchParams.get("status"), inboxStatuses, "status"),
        sourceId: url.searchParams.get("sourceId") ?? undefined,
      }),
    );
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    return Response.json(await createHighlight(user.id, await readJson(request)), {
      status: 201,
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
