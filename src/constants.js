// ─── App Info ────────────────────────────────────────────
export const APP_NAME = 'ssdl';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Spotify Song Downloader';

// ─── Paths ───────────────────────────────────────────────
import { homedir } from 'os';
import { join } from 'path';

export const CONFIG_DIR = join(homedir(), '.ssdl');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
export const DEFAULT_DOWNLOAD_DIR = join(homedir(), 'Music', 'ssdl');

// ─── Spotify ─────────────────────────────────────────────
export const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// ─── ANSI Colors ─────────────────────────────────────────
export const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright foreground
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// ─── Box Drawing Characters ──────────────────────────────
export const BOX = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  teeRight: '├',
  teeLeft: '┤',
  teeDown: '┬',
  teeUp: '┴',
  cross: '┼',
};

// ─── Symbols ─────────────────────────────────────────────
export const SYMBOLS = {
  check: '✅',
  cross: '❌',
  spinner: '🔄',
  queue: '⏳',
  music: '🎵',
  folder: '📁',
  link: '🔗',
  search: '🔍',
  download: '⬇️',
  settings: '⚙️',
  clipboard: '📋',
  arrow: '❯',
  dot: '●',
  block: '█',
  blockLight: '░',
  blockMed: '▒',
  blockFull: '████',
};
