interface ApiErrorPayload {
  error?: { message?: string };
}

export async function requestJson<T>(
  input: RequestInfo,
  init?: RequestInit,
  fallbackMessage = "请求失败，请稍后重试。",
): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;

  if (!response.ok) {
    throw new Error((body as ApiErrorPayload | null)?.error?.message ?? fallbackMessage);
  }

  return body as T;
}
