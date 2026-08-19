import { optionalBoolean, optionalEnum, optionalNumber } from "@/lib/api/query";
import {
  getApiUser,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import {
  graphRelationTypes,
} from "@/lib/graph/types";
import { getGlobalGraph } from "@/lib/services/graph-service";

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    return Response.json(await getGlobalGraph(user.id, {
      tag: url.searchParams.get("tag") ?? undefined,
      relationType: optionalEnum(url.searchParams.get("relationType"), graphRelationTypes, "relationType"),
      includeSuggested: optionalBoolean(url.searchParams.get("includeSuggested")),
      limit: optionalNumber(url.searchParams.get("limit")),
    }));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
