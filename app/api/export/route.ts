import {
  getApiUser,
  serviceErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { createKnowledgeArchive } from "@/lib/services/export-service";

export async function POST(): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const archive = await createKnowledgeArchive(user.id);
    const body = archive.bytes.buffer.slice(
      archive.bytes.byteOffset,
      archive.bytes.byteOffset + archive.bytes.byteLength,
    ) as ArrayBuffer;
    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${archive.fileName}"`,
        "Content-Type": "application/zip",
      },
    });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
