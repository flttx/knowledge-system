import {
  getApiUser,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { getBacklinks } from "@/lib/services/wikilink-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    return Response.json({ items: await getBacklinks(user.id, id) });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
