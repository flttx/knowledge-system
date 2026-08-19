import { getApiUser, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { optionalNumber } from "@/lib/api/query";
import { listInbox } from "@/lib/services/inbox-service";

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    return Response.json(await listInbox(user.id, optionalNumber(url.searchParams.get("limit"))));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
