export const TARGETS = {
  beta: {
    hub: "https://construction.villa.cash",
    key: "https://key.villa.cash",
    chain: 84532,
  },
  production: {
    hub: "https://villa.cash",
    key: "https://key.villa.cash",
    chain: 8453,
  },
  local: {
    hub: "http://localhost:3000",
    key: "http://localhost:3001",
    chain: 84532,
  },
} as const;

export type Target = keyof typeof TARGETS;

export function getTargetConfig(target: Target = "beta") {
  return TARGETS[target];
}

export function deriveAppId(): string {
  if (typeof window === "undefined") return "server";
  return btoa(window.location.origin).slice(0, 16);
}
