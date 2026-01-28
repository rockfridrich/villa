"use client";

import { useState } from "react";
import {
  ExternalLink,
  Code2,
  FileText,
  Rocket,
  Check,
  Star,
  Users,
  Gamepad2,
  Shield,
  Zap,
  TrendingUp,
} from "lucide-react";

interface ShowcaseApp {
  name: string;
  description: string;
  screenshot: string;
  liveUrl: string;
  sourceUrl?: string;
  category: string;
  features: string[];
  status: "live" | "beta" | "demo";
  stats?: {
    users?: string;
    transactions?: string;
    uptime?: string;
  };
}

const showcaseApps: ShowcaseApp[] = [
  // Production Apps
  {
    name: "Residents",
    description:
      "Community directory for Villa ID holders. Discover other residents, view profiles, and connect with the village.",
    screenshot:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://residents.proofofretreat.me/",
    category: "Social",
    features: [
      "Browse all Villa residents",
      "View member profiles and avatars",
      "Search by nickname",
      "Real-time community updates",
    ],
    status: "live",
    stats: {
      users: "2.3k",
      uptime: "99.9%",
    },
  },
  {
    name: "Village Map",
    description:
      "Interactive village explorer. Navigate the pop-up village space and discover locations tied to Villa IDs.",
    screenshot:
      "https://images.unsplash.com/photo-1519302959554-a75be0afc82a?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://map.proofofretreat.me/",
    category: "Social",
    features: [
      "Interactive village map",
      "Location discovery",
      "Villa ID integration",
      "Community landmarks",
    ],
    status: "live",
    stats: {
      users: "1.8k",
      uptime: "99.8%",
    },
  },
  // DeFi Applications
  {
    name: "VillaPay",
    description:
      "Peer-to-peer payments using Villa IDs. Send crypto to nicknames instead of addresses.",
    screenshot:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://pay.villa.cash",
    sourceUrl: "https://github.com/villa-examples/villapay",
    category: "DeFi",
    features: [
      "Send to @nickname",
      "Multi-token support",
      "Transaction history",
      "Gas optimization",
    ],
    status: "demo",
    stats: {
      transactions: "45k",
    },
  },
  {
    name: "Villa Vault",
    description:
      "Decentralized savings account with biometric recovery. Earn yield on Base ecosystem protocols.",
    screenshot:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://vault.villa.cash",
    sourceUrl: "https://github.com/villa-examples/villa-vault",
    category: "DeFi",
    features: [
      "Biometric recovery",
      "Multi-protocol yield",
      "Auto-compounding",
      "Security analytics",
    ],
    status: "beta",
    stats: {
      users: "890",
      transactions: "12k",
    },
  },
  // Gaming
  {
    name: "Villa Quest",
    description:
      "RPG adventure where your Villa ID is your character. Level up, collect NFTs, and compete in the village.",
    screenshot:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://quest.villa.cash",
    sourceUrl: "https://github.com/villa-examples/villa-quest",
    category: "Gaming",
    features: [
      "Character persistence",
      "NFT inventory system",
      "Multiplayer quests",
      "Leaderboards",
    ],
    status: "beta",
    stats: {
      users: "3.2k",
    },
  },
  {
    name: "Village Poker",
    description:
      "Texas Hold'em with Villa ID avatars. Provably fair dealing using Base smart contracts.",
    screenshot:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://poker.villa.cash",
    category: "Gaming",
    features: [
      "Provably fair dealing",
      "Tournament system",
      "Avatar integration",
      "On-chain settlements",
    ],
    status: "demo",
  },
  // Development Tools
  {
    name: "Villa Analytics",
    description:
      "Dashboard for app developers. Track Villa ID usage, conversion rates, and user behavior.",
    screenshot:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://analytics.villa.cash",
    sourceUrl: "https://github.com/villa-examples/villa-analytics",
    category: "Developer",
    features: [
      "Real-time metrics",
      "Conversion tracking",
      "User journey analysis",
      "API performance",
    ],
    status: "beta",
    stats: {
      users: "156",
    },
  },
  {
    name: "Villa Webhooks",
    description:
      "Real-time notifications for Villa ID events. Perfect for building responsive applications.",
    screenshot:
      "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://hooks.villa.cash",
    sourceUrl: "https://github.com/villa-examples/villa-webhooks",
    category: "Developer",
    features: [
      "Event streaming",
      "Retry logic",
      "Rate limiting",
      "Custom filters",
    ],
    status: "live",
    stats: {
      users: "89",
    },
  },
  // Identity Solutions
  {
    name: "Villa Verify",
    description:
      "Reputation and verification system. Build trust through community attestations.",
    screenshot:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://verify.villa.cash",
    category: "Identity",
    features: [
      "Community attestations",
      "Skill verification",
      "Reputation scoring",
      "Privacy controls",
    ],
    status: "demo",
  },
  {
    name: "Villa Connect",
    description:
      "Professional networking for the village. Connect based on skills, interests, and verified achievements.",
    screenshot:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=240&fit=crop&auto=format&q=80",
    liveUrl: "https://connect.villa.cash",
    category: "Identity",
    features: [
      "Professional profiles",
      "Skill matching",
      "Project collaboration",
      "Achievement badges",
    ],
    status: "beta",
    stats: {
      users: "670",
    },
  },
];

const categoryIcons = {
  Social: Users,
  DeFi: TrendingUp,
  Gaming: Gamepad2,
  Developer: Code2,
  Identity: Shield,
};

const statusColors = {
  live: "bg-green-100 text-green-800 border-green-200",
  beta: "bg-blue-100 text-blue-800 border-blue-200",
  demo: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

function AppCard({ app }: { app: ShowcaseApp }) {
  const CategoryIcon =
    categoryIcons[app.category as keyof typeof categoryIcons];
  const statusColor = statusColors[app.status];

  return (
    <div className="bg-cream-50 border border-ink/5 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* Screenshot */}
      <div className="relative h-48 bg-gradient-to-br from-accent-yellow/20 to-accent-yellow/5">
        <img
          src={app.screenshot}
          alt={`${app.name} screenshot`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium border rounded-full ${statusColor}`}
          >
            {app.status}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
            <CategoryIcon className="w-4 h-4 text-ink" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-serif text-xl font-medium">{app.name}</h3>
            {app.stats && (
              <div className="flex gap-3 text-xs text-ink-muted">
                {app.stats.users && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {app.stats.users}
                  </div>
                )}
                {app.stats.transactions && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {app.stats.transactions}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-ink-muted text-sm leading-relaxed">
            {app.description}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-ink">Key Features</h4>
          <ul className="space-y-2">
            {app.features.slice(0, 3).map((feature: string) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-ink-muted"
              >
                <Check className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
            {app.features.length > 3 && (
              <li className="text-xs text-ink-muted pl-6">
                +{app.features.length - 3} more features
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <a
            href={app.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-accent-yellow text-ink font-medium px-4 py-2.5 rounded-lg hover:bg-accent-yellow/90 transition-colors text-sm"
          >
            Try App
            <ExternalLink className="w-4 h-4" />
          </a>
          {app.sourceUrl && (
            <a
              href={app.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-ink/20 px-4 py-2.5 rounded-lg hover:bg-ink/5 transition-colors text-sm"
            >
              <Code2 className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationRequirement({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-cream-50 border border-ink/5 rounded-lg p-4 space-y-2">
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-ink-muted">{description}</p>
    </div>
  );
}

export default function EcosystemPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const categories = ["all", ...Object.keys(categoryIcons)];
  const statuses = ["all", "live", "beta", "demo"];

  const filteredApps = showcaseApps.filter((app) => {
    const categoryMatch =
      selectedCategory === "all" || app.category === selectedCategory;
    const statusMatch =
      selectedStatus === "all" || app.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const appsByCategory = categories.slice(1).reduce(
    (acc, category) => {
      acc[category] = showcaseApps.filter(
        (app) => app.category === category,
      ).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-serif text-5xl tracking-tight">Apps Showcase</h1>
          <p className="text-xl text-ink-muted max-w-2xl mx-auto">
            Discover apps built with Villa SDK. From DeFi to gaming, these
            applications showcase the power of passkey authentication and
            portable identity.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-ink-muted">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>
                {showcaseApps.filter((app) => app.status === "live").length}{" "}
                Live
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>
                {showcaseApps.filter((app) => app.status === "beta").length}{" "}
                Beta
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>
                {showcaseApps.filter((app) => app.status === "demo").length}{" "}
                Demo
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-ink-muted mb-2 sm:mb-0">
                Category:
              </span>
              {categories.map((category) => {
                const CategoryIcon =
                  category !== "all"
                    ? categoryIcons[category as keyof typeof categoryIcons]
                    : null;
                const count =
                  category === "all"
                    ? showcaseApps.length
                    : appsByCategory[category];

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedCategory === category
                        ? "bg-accent-yellow border-accent-yellow text-ink font-medium"
                        : "bg-white border-ink/10 text-ink-muted hover:bg-accent-yellow/10 hover:border-accent-yellow/30"
                    }`}
                  >
                    {CategoryIcon && <CategoryIcon className="w-3 h-3" />}
                    <span className="capitalize">{category}</span>
                    <span className="text-xs opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-ink-muted mb-2 sm:mb-0">
                Status:
              </span>
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize ${
                    selectedStatus === status
                      ? "bg-accent-yellow border-accent-yellow text-ink font-medium"
                      : "bg-white border-ink/10 text-ink-muted hover:bg-accent-yellow/10 hover:border-accent-yellow/30"
                  }`}
                >
                  {status} (
                  {status === "all"
                    ? showcaseApps.length
                    : showcaseApps.filter((app) => app.status === status)
                        .length}
                  )
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">
              {selectedCategory === "all"
                ? "All Apps"
                : `${selectedCategory} Apps`}
              <span className="text-lg text-ink-muted ml-2">
                ({filteredApps.length})
              </span>
            </h2>
            {filteredApps.length === 0 && (
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                }}
                className="text-sm text-accent-yellow hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredApps.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => (
                <AppCard key={app.name} app={app} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-ink-muted">
              <Rocket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">
                No apps found with the selected filters
              </p>
              <p className="text-sm">
                Try adjusting your filters or view all apps
              </p>
            </div>
          )}
        </section>

        {/* Build with Villa */}
        <section className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <Rocket className="w-12 h-12 mx-auto text-accent-yellow" />
            <h2 className="font-serif text-3xl">Build with Villa</h2>
            <p className="text-ink-muted max-w-xl mx-auto">
              Join the ecosystem. Build apps that share a common identity layer
              and reach the entire pop-up village network.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-6 py-3 rounded-lg hover:bg-accent-yellow/90 transition-colors"
            >
              <Code2 className="w-4 h-4" />
              SDK Documentation
            </a>
            <a
              href="https://github.com/rockfridrich/villa/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Contributing Guide
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="border-t border-accent-yellow/20 pt-6">
            <h3 className="font-medium text-center mb-4">Submit Your App</h3>
            <p className="text-sm text-ink-muted text-center max-w-md mx-auto">
              Built something with Villa? We&apos;d love to feature it! Open a
              PR to add your app to this page.
            </p>
            <div className="text-center mt-4">
              <a
                href="https://github.com/rockfridrich/villa/pulls"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent-yellow hover:underline"
              >
                Create Pull Request
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Integration Requirements */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl">Integration Requirements</h2>
            <p className="text-ink-muted">
              What you need to integrate Villa into your app
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <IntegrationRequirement
              title="Villa SDK"
              description="Install @rockfridrich/villa-sdk or @rockfridrich/villa-sdk-react for authentication. Supports TypeScript and works with all modern frameworks."
            />
            <IntegrationRequirement
              title="Base Network"
              description="Villa IDs are deployed on Base (mainnet) and Base Sepolia (testnet). Smart contracts handle ENS-compatible nickname resolution."
            />
            <IntegrationRequirement
              title="HTTPS Required"
              description="Passkey authentication requires a secure context. Use HTTPS in production and localhost/ngrok for development."
            />
            <IntegrationRequirement
              title="Identity Scopes"
              description="Request only the scopes you need: profile (nickname, avatar) and/or address. Users consent during authentication."
            />
          </div>

          <div className="bg-cream-50 border border-ink/5 rounded-lg p-6 space-y-4">
            <h3 className="font-medium">Quick Start</h3>
            <pre className="bg-ink text-cream-50 rounded-lg p-4 overflow-x-auto text-sm">
              <code>{`npm install @rockfridrich/villa-sdk viem zod

import { VillaAuth } from '@rockfridrich/villa-sdk-react'

<VillaAuth
  onComplete={(result) => {
    if (result.success) {
      console.log('Welcome,', result.identity.nickname)
    }
  }}
/>`}</code>
            </pre>
            <p className="text-sm text-ink-muted">
              See the{" "}
              <a href="/" className="text-accent-yellow hover:underline">
                full documentation
              </a>{" "}
              for advanced usage and configuration.
            </p>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="bg-cream-50 border border-ink/5 rounded-xl p-8 space-y-4">
          <h2 className="font-serif text-2xl text-center">
            Privacy & Security
          </h2>
          <div className="space-y-3 text-ink-muted max-w-2xl mx-auto">
            <p>
              All apps in the Villa ecosystem follow the same privacy-first
              principles:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Passkeys never leave devices.</strong> Private keys
                  stay in hardware-backed storage.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <span>
                  <strong>User consent required.</strong> Apps must request and
                  receive permission for data access.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <span>
                  <strong>No passwords, ever.</strong> Biometric authentication
                  via WebAuthn standard.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <span>
                  <strong>ENS-compatible.</strong> Nicknames resolve like ENS
                  names, enabling portable identity.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Footer links */}
        <div className="text-center text-sm text-ink-muted space-y-2">
          <p>Questions about building in the ecosystem?</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/rockfridrich/villa/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-yellow hover:underline inline-flex items-center gap-1"
            >
              GitHub Discussions
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>|</span>
            <a
              href="https://github.com/rockfridrich/villa/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-yellow hover:underline inline-flex items-center gap-1"
            >
              Report Issue
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
