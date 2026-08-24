import { getApiUser, serviceErrorResponse, unauthorizedResponse } from "@/lib/api/response";
import { optionalNumber } from "@/lib/api/query";
import { createScreenshotFromFile, listScreenshots } from "@/lib/services/screenshot-service";
import { ValidationError } from "@/lib/services/errors";

function optionalFormText(form: FormData, name: string): string | null | undefined {
  const value = form.get(name);
  if (value === null) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function GET(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    return Response.json(await listScreenshots(user.id, {
      limit: optionalNumber(url.searchParams.get("limit")),
      cursor: url.searchParams.get("cursor") ?? undefined,
      status: (url.searchParams.get("status") as "inbox" | "processed" | "archived" | null) ?? undefined,
      sourceId: url.searchParams.get("sourceId") ?? undefined,
    }));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const user = await getApiUser();
  if (!user) return unauthorizedResponse();

  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) {
      throw new ValidationError({ image: ["请选择一张图片。"] });
    }

    const screenshot = await createScreenshotFromFile(user.id, image, {
      sourceId: optionalFormText(form, "sourceId"),
      noteId: optionalFormText(form, "noteId"),
      page: optionalFormText(form, "page"),
      location: optionalFormText(form, "location"),
      annotation: optionalFormText(form, "annotation"),
    });
    return Response.json(screenshot, { status: 201 });
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
