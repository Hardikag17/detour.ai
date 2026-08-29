/** Shared plumbing for Google's modern APIs (Routes, Places New). */

export async function googleFetch<T>(
  url: string,
  apiKey: string,
  fieldMask: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(`${res.status} ${data.error?.message ?? 'Google API error'}`);
  }
  return data;
}

/** Pull Google's real error message out of an axios/fetch error for actionable logs. */
export function googleErrorDetail(err: unknown): string {
  const e = err as {
    message?: string;
    response?: { status?: number; data?: { error_message?: string; status?: string } };
  };
  const detail = e.response?.data?.error_message ?? e.response?.data?.status ?? '';
  return `${e.response?.status ?? ''} ${detail || (e.message ?? 'unknown error')}`.trim();
}
