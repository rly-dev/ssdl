import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_DOWNLOAD_DIR } from '../constants.js';

const DEFAULT_CONFIG = {
    spotifyClientId: '',
    spotifyClientSecret: '',
    downloadDir: DEFAULT_DOWNLOAD_DIR,
    audioQuality: 'best',
    audioFormat: 'mp3',
};

/**
 * Load config from ~/.ssdl/config.json
 * Creates default config if it doesn't exist
 */
export function loadConfig() {
    try {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }

        if (!existsSync(CONFIG_FILE)) {
            saveConfig(DEFAULT_CONFIG);
            return { ...DEFAULT_CONFIG };
        }

        const raw = readFileSync(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(raw);
        return { ...DEFAULT_CONFIG, ...config };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

/**
 * Save config to ~/.ssdl/config.json
 */
export function saveConfig(config) {
    try {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
        console.error('Failed to save config:', err.message);
    }
}

/**
 * Check if Spotify credentials are configured
 */
export function hasCredentials(config) {
    return !!(config.spotifyClientId && config.spotifyClientSecret);
}

/**
 * Update specific config values
 */
export function updateConfig(updates) {
    const config = loadConfig();
    const updated = { ...config, ...updates };
    saveConfig(updated);
    return updated;
}
