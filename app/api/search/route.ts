import { optionalEnum, optionalNumber } from "@/lib/api/query";
import {
  getApiUser,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { search } from "@/lib/services/search-service";
import { searchTypes } from "@/lib/search/types";

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const type = optionalEnum(url.searchParams.get("type"), searchTypes, "type") ?? "all";
    const limit = optionalNumber(url.searchParams.get("limit")) ?? 20;
    return Response.json({
      items: await search(user.id, url.searchParams.get("q") ?? "", { type, limit }),
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
