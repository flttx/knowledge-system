import { getApiUser, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { readOwnedAttachment } from "@/lib/services/attachment-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();
  try {
    const { id } = await context.params;
    const attachment = await readOwnedAttachment(user.id, id);
    return new Response(attachment.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": attachment.mimeType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
