/**
 * Privacy-respecting analytics adapter (Plausible-style).
 * No-ops when VITE_ANALYTICS_DOMAIN is unset — live integration unconfigured.
 */

function analyticsDomain(): string | null {
  const domain =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_ANALYTICS_DOMAIN?.trim()) || null;
  return domain || null;
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(analyticsDomain());
}

export function trackPageView(path?: string): void {
  const domain = analyticsDomain();
  if (!domain) {
    if (import.meta.env.DEV) {
      console.debug("[analytics] unconfigured — skip pageview", path ?? window?.location?.pathname);
    }
    return;
  }
  if (typeof window === "undefined") return;
  const url = path ?? window.location.pathname + window.location.search;
  try {
    const payload = { name: "pageview", url: window.location.origin + url, domain };
    void fetch(`https://plausible.io/api/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
  const domain = analyticsDomain();
  if (!domain) {
    if (import.meta.env.DEV) {
      console.debug("[analytics] unconfigured — skip event", name, props);
    }
    return;
  }
  if (typeof window === "undefined") return;
  try {
    void fetch(`https://plausible.io/api/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        url: window.location.href,
        domain,
        props,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}
