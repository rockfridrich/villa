const PLAUSIBLE_DOMAIN = "developers.villa.cash";

type PlausibleEvent =
  | { name: "pageview" }
  | { name: "Code Copy"; props: { example: string } }
  | { name: "Search"; props: { query: string; results: number } }
  | { name: "CLAUDE.txt View" }
  | { name: "Section Scroll"; props: { section: string } };

export function trackEvent(event: PlausibleEvent): void {
  if (typeof window === "undefined") return;

  const plausible = (
    window as Window & {
      plausible?: (
        name: string,
        options?: { props?: Record<string, string | number> },
      ) => void;
    }
  ).plausible;

  if (!plausible) return;

  if (event.name === "pageview") {
    plausible("pageview");
  } else if ("props" in event) {
    plausible(event.name, { props: event.props });
  } else {
    plausible(event.name);
  }
}

export function trackPageView(): void {
  trackEvent({ name: "pageview" });
}

export function trackCodeCopy(example: string): void {
  trackEvent({ name: "Code Copy", props: { example } });
}

export function trackSearch(query: string, results: number): void {
  trackEvent({ name: "Search", props: { query, results } });
}

export function trackClaudeTxtView(): void {
  trackEvent({ name: "CLAUDE.txt View" });
}

export function trackSectionScroll(section: string): void {
  trackEvent({ name: "Section Scroll", props: { section } });
}
