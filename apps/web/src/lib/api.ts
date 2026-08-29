import { DEFAULT_API_URL } from '@detour/shared/helpers/constants';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

/** One-shot GraphQL query/mutation. */
export async function gqlRequest<T>(query: string, variables?: object): Promise<T> {
  console.log({ query, variables })
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

/**
 * GraphQL subscription over SSE: POSTs the document and yields each parsed
 * `data:` payload as it streams in (Yoga serves subscriptions this way natively).
 */
export async function* gqlSubscribe<T>(
  query: string,
  variables: object,
  signal: AbortSignal,
): AsyncGenerator<T> {
  console.log(API_URL, query, variables, signal)
  const res = await fetch(API_URL, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok || !res.body) throw new Error(`API responded ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line; data lines carry the payload.
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const data = frame
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('\n');
      if (!data) continue;
      try {
        yield JSON.parse(data) as T;
      } catch {
        // Ignore non-JSON keepalive frames.
      }
    }
  }
}
