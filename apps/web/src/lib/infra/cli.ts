#!/usr/bin/env npx tsx
/**
 * Infrastructure CLI
 *
 * Unified CLI for all infrastructure operations.
 * Uses typed SDKs instead of raw curl/bash commands.
 *
 * Usage:
 *   npx tsx src/lib/infra/cli.ts cloudflare cache purge-all
 *   npx tsx src/lib/infra/cli.ts cloudflare dns list
 *   npx tsx src/lib/infra/cli.ts cloudflare zone status
 *
 * Or via npm scripts:
 *   npm run infra cloudflare cache purge-all
 */

import { cloudflare } from './cloudflare';

const commands: Record<
  string,
  Record<string, Record<string, () => Promise<void>>>
> = {
  cloudflare: {
    cache: {
      'purge-all': async () => {
        console.log('Purging all CloudFlare cache...');
        const result = await cloudflare.cache.purgeAll();
        console.log('✓ Cache purged:', result);
      },
      'purge-urls': async () => {
        const urls = process.argv.slice(5);
        if (urls.length === 0) {
          console.error('Usage: ... cache purge-urls <url1> <url2> ...');
          process.exit(1);
        }
        console.log(`Purging ${urls.length} URLs...`);
        const result = await cloudflare.cache.purgeUrls(urls);
        console.log('✓ URLs purged:', result);
      },
    },
    zone: {
      status: async () => {
        console.log('Getting zone status...');
        const status = await cloudflare.zone.getStatus();
        console.log('Zone Status:');
        console.log(`  ID: ${status.id}`);
        console.log(`  Name: ${status.name}`);
        console.log(`  Status: ${status.status}`);
        console.log(`  Plan: ${status.plan}`);
        console.log(`  Paused: ${status.paused}`);
      },
      'dev-mode-on': async () => {
        console.log('Enabling development mode...');
        const result = await cloudflare.zone.enableDevMode();
        console.log(`✓ Dev mode enabled (expires in ${result.expiresIn}s)`);
      },
      'dev-mode-off': async () => {
        console.log('Disabling development mode...');
        await cloudflare.zone.disableDevMode();
        console.log('✓ Dev mode disabled');
      },
    },
    dns: {
      list: async () => {
        console.log('Listing DNS records...');
        const records = await cloudflare.dns.list();
        console.log('\nDNS Records:');
        for (const r of records) {
          const proxy = r.proxied ? '[Proxied]' : '[DNS only]';
          console.log(`  ${r.type.padEnd(6)} ${r.name.padEnd(25)} → ${r.content} ${proxy}`);
        }
      },
      'set-proxy': async () => {
        const [name, mode] = process.argv.slice(5);
        if (!name || !['on', 'off'].includes(mode)) {
          console.error('Usage: ... dns set-proxy <name> <on|off>');
          process.exit(1);
        }
        console.log(`Setting proxy mode for ${name} to ${mode}...`);
        await cloudflare.dns.setProxy(name, mode === 'on');
        console.log(`✓ Proxy ${mode} for ${name}`);
      },
      upsert: async () => {
        const [name, target, ...flags] = process.argv.slice(5);
        if (!name || !target) {
          console.error('Usage: ... dns upsert <name> <target> [--no-proxy]');
          process.exit(1);
        }
        const proxied = !flags.includes('--no-proxy');
        console.log(`Upserting ${name} → ${target} (proxy: ${proxied})...`);
        const result = await cloudflare.dns.upsert(name, target, { proxied });
        console.log(`✓ DNS record upserted: ${result.name}`);
      },
    },
    ssl: {
      status: async () => {
        console.log('Getting SSL mode...');
        const mode = await cloudflare.ssl.getMode();
        console.log(`SSL Mode: ${mode}`);
      },
      'set-mode': async () => {
        const mode = process.argv[5] as 'off' | 'flexible' | 'full' | 'strict';
        if (!['off', 'flexible', 'full', 'strict'].includes(mode)) {
          console.error('Usage: ... ssl set-mode <off|flexible|full|strict>');
          process.exit(1);
        }
        console.log(`Setting SSL mode to ${mode}...`);
        await cloudflare.ssl.setMode(mode);
        console.log(`✓ SSL mode set to ${mode}`);
      },
    },
  },
};

async function main() {
  const [service, category, command] = process.argv.slice(2);

  if (!service || service === 'help') {
    printHelp();
    return;
  }

  const serviceCommands = commands[service];
  if (!serviceCommands) {
    console.error(`Unknown service: ${service}`);
    console.error(`Available: ${Object.keys(commands).join(', ')}`);
    process.exit(1);
  }

  if (!category) {
    console.error(`Missing category for ${service}`);
    console.error(`Available: ${Object.keys(serviceCommands).join(', ')}`);
    process.exit(1);
  }

  const categoryCommands = serviceCommands[category];
  if (!categoryCommands) {
    console.error(`Unknown category: ${service} ${category}`);
    console.error(`Available: ${Object.keys(serviceCommands).join(', ')}`);
    process.exit(1);
  }

  if (!command) {
    console.error(`Missing command for ${service} ${category}`);
    console.error(`Available: ${Object.keys(categoryCommands).join(', ')}`);
    process.exit(1);
  }

  const handler = categoryCommands[command];
  if (!handler) {
    console.error(`Unknown command: ${service} ${category} ${command}`);
    console.error(`Available: ${Object.keys(categoryCommands).join(', ')}`);
    process.exit(1);
  }

  try {
    await handler();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Infrastructure CLI - SDK-based infrastructure management

Usage:
  npm run infra <service> <category> <command> [args...]

Services:
  cloudflare    CloudFlare CDN, DNS, SSL management

CloudFlare Commands:
  cache purge-all              Purge all cached content
  cache purge-urls <urls...>   Purge specific URLs
  zone status                  Get zone status
  zone dev-mode-on             Enable dev mode (3 hours)
  zone dev-mode-off            Disable dev mode
  dns list                     List all DNS records
  dns set-proxy <name> <on|off> Set proxy mode
  dns upsert <name> <target> [--no-proxy] Create/update DNS record
  ssl status                   Get SSL mode
  ssl set-mode <mode>          Set SSL mode

Examples:
  npm run infra cloudflare cache purge-all
  npm run infra cloudflare dns list
  npm run infra cloudflare zone status
`);
}

main();
