import { getApiUser, readJson, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { optionalEnum, optionalNumber } from "@/lib/api/query";
import {
  createSource,
  listSources,
} from "@/lib/services/source-service";
import { sourceTypes } from "@/lib/services/validation";

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const items = await listSources(user.id, {
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: optionalNumber(url.searchParams.get("limit")),
      sourceType: optionalEnum(url.searchParams.get("sourceType"), sourceTypes, "sourceType"),
      publication: url.searchParams.get("publication") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      archived: url.searchParams.get("archived") === "true",
    });
    return Response.json(items);
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const source = await createSource(user.id, await readJson(request));
    return Response.json(source, { status: 201 });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
