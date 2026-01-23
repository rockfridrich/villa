import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DatabaseStatus {
  status: "ok" | "error" | "unknown";
  provider: string;
  region: string;
  backups: {
    latest: string | null;
    count: number;
  };
  links: {
    console: string;
    backups: string;
  };
  fetchedAt: string;
  error?: string;
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  
  let provider = "unknown";
  let region = "unknown";
  let consoleUrl = "";
  let backupsUrl = "";

  if (dbUrl.includes("ondigitalocean.com")) {
    provider = "DigitalOcean";
    region = "NYC";
    consoleUrl = "https://cloud.digitalocean.com/databases";
    backupsUrl = "https://cloud.digitalocean.com/databases";
  } else if (dbUrl.includes("turso") || dbUrl.includes("libsql")) {
    provider = "Turso";
    region = "Global Edge";
    consoleUrl = "https://turso.tech/app";
    backupsUrl = "https://turso.tech/app";
  } else if (dbUrl.includes("neon")) {
    provider = "Neon";
    region = "AWS";
    consoleUrl = "https://console.neon.tech";
    backupsUrl = "https://console.neon.tech";
  } else if (dbUrl.includes("supabase")) {
    provider = "Supabase";
    region = "AWS";
    consoleUrl = "https://supabase.com/dashboard";
    backupsUrl = "https://supabase.com/dashboard";
  }

  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    const backupDir = process.env.BACKUP_DIR || "/Users/me/Documents/Coding/villa/backups";
    
    let backupCount = 0;
    let latestBackup: string | null = null;
    
    try {
      const { stdout } = await execAsync(`ls -t ${backupDir}/*.sql.gz 2>/dev/null | head -5`, { timeout: 3000 });
      const files = stdout.trim().split("\n").filter(Boolean);
      backupCount = files.length;
      if (files.length > 0) {
        const filename = files[0].split("/").pop() || "";
        const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
        latestBackup = match ? match[1] : filename;
      }
    } catch {
      // No backups found
    }

    return NextResponse.json({
      status: dbUrl ? "ok" : "unknown",
      provider,
      region,
      backups: {
        latest: latestBackup,
        count: backupCount,
      },
      links: {
        console: consoleUrl,
        backups: backupsUrl,
      },
      fetchedAt: new Date().toISOString(),
    } as DatabaseStatus);
  } catch (error) {
    return NextResponse.json({
      status: "error",
      provider,
      region,
      backups: { latest: null, count: 0 },
      links: { console: consoleUrl, backups: backupsUrl },
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    } as DatabaseStatus);
  }
}
