/**
 * CloudFlare Infrastructure SDK
 *
 * Typed wrapper around CloudFlare API for Villa infrastructure management.
 * Uses fetch API with proper typing for reliability.
 *
 * @example
 * ```ts
 * import { cloudflare } from '@/lib/infra/cloudflare';
 *
 * // Purge cache after deploy
 * await cloudflare.cache.purgeAll();
 *
 * // Check zone status
 * const status = await cloudflare.zone.getStatus();
 * ```
 */

function getApiToken(): string {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN not set. Add it to your environment or .env.local'
    );
  }
  return token;
}

function getZoneId(): string {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    throw new Error('CLOUDFLARE_ZONE_ID not set.');
  }
  return zoneId;
}

interface CloudFlareResponse<T> {
  success: boolean;
  result: T;
  errors: Array<{ code: number; message: string }>;
}

async function cfFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getApiToken();
  const response = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = (await response.json()) as CloudFlareResponse<T>;

  if (!data.success) {
    throw new Error(
      `CloudFlare API error: ${data.errors.map((e) => e.message).join(', ')}`
    );
  }

  return data.result;
}

// ============================================================================
// Cache Operations
// ============================================================================

export const cache = {
  async purgeAll(): Promise<{ success: boolean; id?: string }> {
    const zoneId = getZoneId();
    const result = await cfFetch<{ id: string }>(
      `/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        body: JSON.stringify({ purge_everything: true }),
      }
    );
    return { success: true, id: result.id };
  },

  async purgeUrls(urls: string[]): Promise<{ success: boolean; id?: string }> {
    const zoneId = getZoneId();
    const result = await cfFetch<{ id: string }>(
      `/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        body: JSON.stringify({ files: urls }),
      }
    );
    return { success: true, id: result.id };
  },

  async purgePrefix(
    prefixes: string[]
  ): Promise<{ success: boolean; id?: string }> {
    const zoneId = getZoneId();
    const result = await cfFetch<{ id: string }>(
      `/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        body: JSON.stringify({ prefixes }),
      }
    );
    return { success: true, id: result.id };
  },
};

// ============================================================================
// Zone Operations
// ============================================================================

interface ZoneResult {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  plan: { name: string };
}

export const zone = {
  async getStatus(): Promise<{
    id: string;
    name: string;
    status: string;
    paused: boolean;
    plan: string;
  }> {
    const zoneId = getZoneId();
    const result = await cfFetch<ZoneResult>(`/zones/${zoneId}`);
    return {
      id: result.id,
      name: result.name,
      status: result.status,
      paused: result.paused,
      plan: result.plan?.name ?? 'unknown',
    };
  },

  async enableDevMode(): Promise<{ success: boolean; expiresIn: number }> {
    const zoneId = getZoneId();
    await cfFetch(`/zones/${zoneId}/settings/development_mode`, {
      method: 'PATCH',
      body: JSON.stringify({ value: 'on' }),
    });
    return { success: true, expiresIn: 3 * 60 * 60 };
  },

  async disableDevMode(): Promise<{ success: boolean }> {
    const zoneId = getZoneId();
    await cfFetch(`/zones/${zoneId}/settings/development_mode`, {
      method: 'PATCH',
      body: JSON.stringify({ value: 'off' }),
    });
    return { success: true };
  },
};

// ============================================================================
// DNS Operations
// ============================================================================

export interface DNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

interface DNSRecordResult {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

export const dns = {
  async list(): Promise<DNSRecord[]> {
    const zoneId = getZoneId();
    const records = await cfFetch<DNSRecordResult[]>(
      `/zones/${zoneId}/dns_records`
    );
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      content: r.content,
      proxied: r.proxied,
      ttl: r.ttl,
    }));
  },

  async upsert(
    name: string,
    content: string,
    options: { type?: string; proxied?: boolean } = {}
  ): Promise<DNSRecord> {
    const zoneId = getZoneId();
    const type = options.type ?? 'CNAME';
    const proxied = options.proxied ?? true;
    const fullName = name.includes('.') ? name : `${name}.villa.cash`;

    // Check if record exists
    const existing = await cfFetch<DNSRecordResult[]>(
      `/zones/${zoneId}/dns_records?type=${type}&name=${fullName}`
    );

    if (existing.length > 0) {
      const recordId = existing[0].id;
      const result = await cfFetch<DNSRecordResult>(
        `/zones/${zoneId}/dns_records/${recordId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ type, name: fullName, content, proxied }),
        }
      );
      return result;
    }

    const result = await cfFetch<DNSRecordResult>(
      `/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        body: JSON.stringify({ type, name: fullName, content, proxied, ttl: 1 }),
      }
    );
    return result;
  },

  async setProxy(name: string, proxied: boolean): Promise<{ success: boolean }> {
    const zoneId = getZoneId();
    const fullName = name.includes('.') ? name : `${name}.villa.cash`;

    const existing = await cfFetch<DNSRecordResult[]>(
      `/zones/${zoneId}/dns_records?name=${fullName}`
    );

    if (existing.length === 0) {
      throw new Error(`DNS record not found: ${fullName}`);
    }

    const record = existing[0];
    await cfFetch(`/zones/${zoneId}/dns_records/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        proxied,
      }),
    });

    return { success: true };
  },
};

// ============================================================================
// SSL Operations
// ============================================================================

interface SettingResult {
  value: string;
}

export const ssl = {
  async getMode(): Promise<string> {
    const zoneId = getZoneId();
    const result = await cfFetch<SettingResult>(
      `/zones/${zoneId}/settings/ssl`
    );
    return result.value;
  },

  async setMode(
    mode: 'off' | 'flexible' | 'full' | 'strict'
  ): Promise<{ success: boolean }> {
    const zoneId = getZoneId();
    await cfFetch(`/zones/${zoneId}/settings/ssl`, {
      method: 'PATCH',
      body: JSON.stringify({ value: mode }),
    });
    return { success: true };
  },
};

// ============================================================================
// Convenience Export
// ============================================================================

export const cloudflare = {
  cache,
  zone,
  dns,
  ssl,
};

export default cloudflare;
