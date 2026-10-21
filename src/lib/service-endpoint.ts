/** Accept a same-origin path or an explicitly configured HTTP(S) endpoint. */
export function resolveServiceEndpoint(
  value: string | undefined,
  production: boolean,
): string | undefined {
  const endpoint = value?.trim();
  if (!endpoint || /[\s\\]/.test(endpoint)) return undefined;
  if (endpoint.startsWith("/") && !endpoint.startsWith("//")) return endpoint;
  try {
    const parsed = new URL(endpoint);
    if (parsed.username || parsed.password) return undefined;
    if (parsed.protocol !== "https:" && (production || parsed.protocol !== "http:"))
      return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/** Resolve endpoints that receive a user's bearer token; production must stay same-origin. */
export function resolveBearerServiceEndpoint(
  value: string | undefined,
  production: boolean,
  currentOrigin: string | undefined,
): string | undefined {
  const endpoint = resolveServiceEndpoint(value, production);
  if (!endpoint || endpoint.startsWith("/")) return endpoint;
  if (!production) return endpoint;
  try {
    if (!currentOrigin) return undefined;
    return new URL(endpoint).origin === new URL(currentOrigin).origin ? endpoint : undefined;
  } catch {
    return undefined;
  }
}
