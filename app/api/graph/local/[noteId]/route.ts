import { optionalBoolean, optionalNumber } from "@/lib/api/query";
import {
  getApiUser,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { getLocalGraph } from "@/lib/services/graph-service";
import { ValidationError } from "@/lib/services/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> },
): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { noteId } = await params;
    const url = new URL(request.url);
    const depth = optionalNumber(url.searchParams.get("depth"));
    if (depth !== undefined && depth !== 1 && depth !== 2) {
      throw new ValidationError({ depth: ["depth must be 1 or 2."] });
    }
    const includeSuggested = optionalBoolean(url.searchParams.get("includeSuggested"));
    return Response.json(await getLocalGraph(user.id, noteId, {
      depth,
      includeSuggested,
    }));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
