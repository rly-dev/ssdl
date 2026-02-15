#!/usr/bin/env node

import { checkDeps, printDepInstructions } from '../src/utils/deps.js';
import { startApp } from '../src/app.js';

// ─── Parse CLI Arguments ─────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
let positionalUrl = null;

for (const arg of args) {
  if (arg === '--help' || arg === '-h') {
    flags.help = true;
  } else if (arg === '--version' || arg === '-v') {
    flags.version = true;
  } else if (!arg.startsWith('-')) {
    positionalUrl = arg;
  }
}

// ─── Help ────────────────────────────────────────────────
if (flags.help) {
  console.log(`
  ssdl — Spotify Song Downloader

  Usage:
    ssdl                          Interactive mode
    ssdl <spotify-url>            Download directly from URL

  Options:
    -h, --help                    Show this help
    -v, --version                 Show version

  Supported URLs:
    https://open.spotify.com/track/...
    https://open.spotify.com/album/...
    https://open.spotify.com/playlist/...

  First Run:
    You'll be prompted for your Spotify API credentials.
    Get them at: https://developer.spotify.com/dashboard
  `);
  process.exit(0);
}

// ─── Version ─────────────────────────────────────────────
if (flags.version) {
  const { APP_VERSION } = await import('../src/constants.js');
  console.log(`ssdl v${APP_VERSION}`);
  process.exit(0);
}

// ─── Check System Dependencies ───────────────────────────
const { ok, missing } = checkDeps();
if (!ok) {
  printDepInstructions(missing);
  process.exit(1);
}

// ─── Launch App ──────────────────────────────────────────
try {
  await startApp(positionalUrl);
} catch (err) {
  console.error(`\n  ✗ Fatal error: ${err.message}\n`);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
}
