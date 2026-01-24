#!/usr/bin/env npx tsx
/**
 * Villa Contributor Statistics Generator
 *
 * Generates contributor statistics from git history and GitHub API.
 * Output is written to .github/stats/contributors.json
 *
 * Usage:
 *   npx tsx scripts/stats-generate.ts [--since=TAG]
 *
 * Environment:
 *   GITHUB_TOKEN - GitHub API token (optional, for higher rate limits)
 */

import { execFileSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Security: Validate git reference format (tag, branch, commit)
function isValidGitRef(ref: string): boolean {
  // Allow: v1.0.0, main, feature/foo, abc123def
  // Disallow: anything with shell metacharacters
  return /^[a-zA-Z0-9._\-\/]+$/.test(ref);
}

// Security: Validate commit hash format
function isValidCommitHash(hash: string): boolean {
  return /^[a-f0-9]{7,40}$/i.test(hash);
}

// Types
interface ContributorStats {
  username: string;
  commits: number;
  additions: number;
  deletions: number;
  prsOpened: number;
  prsMerged: number;
  firstContribution: string;
  latestContribution: string;
  achievements: string[];
}

interface StatsOutput {
  generated: string;
  period: {
    since: string;
    until: string;
  };
  totals: {
    commits: number;
    contributors: number;
    additions: number;
    deletions: number;
  };
  contributors: ContributorStats[];
  newContributors: string[];
}

// Helpers - using execFileSync to prevent command injection
function execGit(args: string[]): string {
  try {
    return execFileSync("git", args, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch {
    return "";
  }
}

function getGitLog(since?: string): string {
  const args = ["log", "--pretty=format:%H|%an|%ae|%ad|%s", "--date=iso", "--no-merges"];

  if (since) {
    // Security: Validate the ref before using it
    if (!isValidGitRef(since)) {
      console.error(`Invalid git reference: ${since}`);
      return "";
    }
    args.splice(1, 0, `${since}..HEAD`);
  }

  return execGit(args);
}

function getCommitStats(hash: string): { additions: number; deletions: number } {
  // Security: Validate commit hash format
  if (!isValidCommitHash(hash)) {
    return { additions: 0, deletions: 0 };
  }

  const stats = execGit(["show", "--stat", "--format=", hash]);
  const lastLine = stats.split("\n").pop() || "";

  const match = lastLine.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(-\)/);
  if (match) {
    return { additions: parseInt(match[1]), deletions: parseInt(match[2]) };
  }
  // Try alternative format
  const addMatch = lastLine.match(/(\d+) insertions?\(\+\)/);
  const delMatch = lastLine.match(/(\d+) deletions?\(-\)/);
  return {
    additions: addMatch ? parseInt(addMatch[1]) : 0,
    deletions: delMatch ? parseInt(delMatch[1]) : 0,
  };
}

function getPreviousTag(): string | undefined {
  const tags = execGit(["tag", "--sort=-creatordate"]).split("\n").filter(Boolean);
  return tags[1]; // Skip current tag, get previous
}

function normalizeEmail(email: string): string {
  // Map common email variations to canonical username
  const emailMap: Record<string, string> = {
    // Add mappings as needed
  };
  return emailMap[email.toLowerCase()] || email;
}

function determineAchievements(stats: ContributorStats): string[] {
  const achievements: string[] = [];

  if (stats.commits >= 1) achievements.push("first-pr");
  if (stats.prsMerged >= 1) achievements.push("first-merge");
  if (stats.commits >= 10) achievements.push("contributor-level-2");
  if (stats.commits >= 50) achievements.push("trusted-contributor");

  // Check for bug fixes (commits starting with "fix:")
  // This would need git log parsing with message filter

  return achievements;
}

async function main() {
  console.log("📊 Villa Stats Generator\n");

  // Parse args
  const args = process.argv.slice(2);
  let sinceTag: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--since=")) {
      sinceTag = arg.split("=")[1];
    }
  }

  // Get previous tag if not specified
  if (!sinceTag) {
    sinceTag = getPreviousTag();
  }

  console.log(`Period: ${sinceTag || "all time"} → HEAD\n`);

  // Get git log
  const gitLog = getGitLog(sinceTag);
  if (!gitLog) {
    console.log("No commits found in range");
    process.exit(0);
  }

  const commits = gitLog.split("\n").filter(Boolean);
  console.log(`Found ${commits.length} commits\n`);

  // Aggregate by contributor
  const contributorMap = new Map<string, ContributorStats>();

  for (const line of commits) {
    const [hash, name, email, date, message] = line.split("|");
    const key = normalizeEmail(email) || name;

    if (!contributorMap.has(key)) {
      contributorMap.set(key, {
        username: name,
        commits: 0,
        additions: 0,
        deletions: 0,
        prsOpened: 0,
        prsMerged: 0,
        firstContribution: date,
        latestContribution: date,
        achievements: [],
      });
    }

    const stats = contributorMap.get(key)!;
    stats.commits++;
    stats.latestContribution = date;

    // Get line stats (expensive, so sample for large repos)
    if (commits.length < 500) {
      const lineStats = getCommitStats(hash);
      stats.additions += lineStats.additions;
      stats.deletions += lineStats.deletions;
    }
  }

  // Calculate achievements
  for (const [, stats] of contributorMap) {
    stats.achievements = determineAchievements(stats);
  }

  // Sort by commits
  const sortedContributors = Array.from(contributorMap.values()).sort(
    (a, b) => b.commits - a.commits
  );

  // Calculate totals
  const totals = sortedContributors.reduce(
    (acc, c) => ({
      commits: acc.commits + c.commits,
      contributors: acc.contributors + 1,
      additions: acc.additions + c.additions,
      deletions: acc.deletions + c.deletions,
    }),
    { commits: 0, contributors: 0, additions: 0, deletions: 0 }
  );

  // Identify new contributors (first contribution in this period)
  const newContributors = sortedContributors
    .filter((c) => c.commits === 1 || !sinceTag)
    .map((c) => c.username);

  // Build output
  const output: StatsOutput = {
    generated: new Date().toISOString(),
    period: {
      since: sinceTag || "beginning",
      until: "HEAD",
    },
    totals,
    contributors: sortedContributors,
    newContributors,
  };

  // Ensure output directory exists
  const outputDir = join(process.cwd(), ".github", "stats");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON
  const outputPath = join(outputDir, "contributors.json");
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Stats written to ${outputPath}\n`);

  // Print summary
  console.log("📈 Summary");
  console.log("─".repeat(40));
  console.log(`Total commits: ${totals.commits}`);
  console.log(`Contributors: ${totals.contributors}`);
  console.log(`Lines added: +${totals.additions}`);
  console.log(`Lines removed: -${totals.deletions}`);
  console.log("");

  console.log("🏆 Top Contributors");
  console.log("─".repeat(40));
  sortedContributors.slice(0, 10).forEach((c, i) => {
    console.log(`${i + 1}. ${c.username} - ${c.commits} commits`);
  });

  if (newContributors.length > 0) {
    console.log("\n🆕 New Contributors");
    console.log("─".repeat(40));
    newContributors.forEach((name) => console.log(`  • ${name}`));
  }

  // Generate markdown for release notes
  const markdown = generateReleaseMarkdown(output);
  const markdownPath = join(outputDir, "release-notes.md");
  writeFileSync(markdownPath, markdown);
  console.log(`\n📝 Release notes written to ${markdownPath}`);
}

function generateReleaseMarkdown(stats: StatsOutput): string {
  const lines: string[] = [];

  lines.push("## 🏆 Contributors\n");
  lines.push("| Rank | Contributor | Commits | Lines |");
  lines.push("|------|-------------|---------|-------|");

  stats.contributors.slice(0, 10).forEach((c, i) => {
    const lines_changed = `+${c.additions}/-${c.deletions}`;
    lines.push(`| ${i + 1} | ${c.username} | ${c.commits} | ${lines_changed} |`);
  });

  if (stats.newContributors.length > 0) {
    lines.push("\n### 🆕 New Contributors\n");
    lines.push(`Welcome ${stats.newContributors.join(", ")}!\n`);
  }

  lines.push("\n### 📊 Stats\n");
  lines.push(`- **Total Commits:** ${stats.totals.commits}`);
  lines.push(`- **Contributors:** ${stats.totals.contributors}`);
  lines.push(`- **Lines Changed:** +${stats.totals.additions}/-${stats.totals.deletions}`);

  return lines.join("\n");
}

// Run
main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
