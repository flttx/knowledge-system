import { optionalNumber } from "@/lib/api/query";
import {
  getApiUser,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { searchNoteTitles } from "@/lib/services/search-service";

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    return Response.json({
      items: await searchNoteTitles(
        user.id,
        url.searchParams.get("q") ?? "",
        optionalNumber(url.searchParams.get("limit")),
      ),
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
