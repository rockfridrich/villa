/**
 * Privacy-Preserving Analytics
 *
 * Tracks documentation usage without tracking users.
 * Only aggregate metrics are stored - no cookies, fingerprints, or user identifiers.
 *
 * Tracked: Page views (aggregate), code copies, search queries
 * NOT tracked: User identity, IP, fingerprints, referrers, location
 */

type AnalyticsEvent =
  | { type: "page_view"; page: string }
  | { type: "code_copy"; example_id: string }
  | { type: "search"; query: string; results_count: number }
  | { type: "claude_txt_view" }
  | { type: "section_scroll"; section: string };

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[Analytics]", event);
    return;
  }

  try {
    const dayBucket = new Date().toISOString().split("T")[0];

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, day: dayBucket }),
      keepalive: true,
    });
  } catch {
    /* noop */
  }
}

export function trackPageView(page: string): void {
  trackEvent({ type: "page_view", page });
}

export function trackCodeCopy(exampleId: string): void {
  trackEvent({ type: "code_copy", example_id: exampleId });
}

export function trackSearch(query: string, resultsCount: number): void {
  trackEvent({ type: "search", query, results_count: resultsCount });
}

export function trackClaudeTxtView(): void {
  trackEvent({ type: "claude_txt_view" });
}

export function trackSectionScroll(section: string): void {
  trackEvent({ type: "section_scroll", section });
}
