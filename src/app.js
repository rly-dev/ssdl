import { createInputHandler } from './tui/input.js';
import { render, c, cursor, screen } from './tui/renderer.js';
import { formatDuration } from './utils/format.js';
import { loadConfig, saveConfig, hasCredentials } from './utils/config.js';
import { textInput } from './tui/input.js';
import * as spotify from './services/spotify.js';
import { showWelcome } from './screens/Welcome.js';
import { showURLInput } from './screens/URLInput.js';
import { showSearch } from './screens/Search.js';
import { showTrackList } from './screens/TrackList.js';
import { showDownloading } from './screens/Downloading.js';
import { showComplete } from './screens/Complete.js';

/**
 * Main application — handles screen routing and state management
 */
export async function startApp(initialUrl = null) {
    const input = createInputHandler();
    const config = loadConfig();

    // Ensure clean exit
    process.on('exit', () => {
        cursor.show();
        if (process.stdin.isTTY) {
            try { process.stdin.setRawMode(false); } catch { }
        }
    });

    cursor.hide();

    try {
        // ─── Step 1: Check / prompt for Spotify credentials ────
        if (!hasCredentials(config)) {
            await promptCredentials(input, config);
        }

        // ─── Step 2: Authenticate with Spotify ─────────────────
        if (!spotify.isAuthenticated()) {
            screen.clear();
            render('\n' + c.cyan('  Authenticating with Spotify...'));

            try {
                await spotify.authenticate(config.spotifyClientId, config.spotifyClientSecret);
            } catch (err) {
                render('\n' + c.red(`  ✗ Authentication failed: ${err.message}\n\n`) +
                    c.dim('  Check your Client ID and Secret.\n') +
                    c.dim('  Run ssdl again to re-enter credentials.\n'));

                // Clear saved credentials so they're prompted again
                config.spotifyClientId = '';
                config.spotifyClientSecret = '';
                saveConfig(config);

                cursor.show();
                input.destroy();
                process.exit(1);
            }
        }

        // ─── Step 3: If a URL was passed as argument, skip to it ─
        if (initialUrl) {
            await handleUrl(initialUrl, config, input);
            cursor.show();
            input.destroy();
            return;
        }

        // ─── Step 4: Main loop — Welcome screen ────────────────
        let running = true;
        while (running) {
            const action = await showWelcome(input);

            switch (action) {
                case 'url': {
                    const url = await showURLInput(input);
                    if (url) {
                        await handleUrl(url, config, input);
                    }
                    break;
                }

                case 'search': {
                    const track = await showSearch(input);
                    if (track) {
                        await handleTracks([track], 'track', config, input);
                    }
                    break;
                }

                case 'settings': {
                    await showSettings(input, config);
                    break;
                }

                case 'exit':
                    running = false;
                    break;
            }
        }
    } finally {
        cursor.show();
        input.destroy();
        screen.clear();
        console.log(c.dim('  Goodbye!\n'));
    }
}

/**
 * Handle a Spotify URL — parse, fetch metadata, show tracks, download
 */
async function handleUrl(url, config, input) {
    const parsed = spotify.parseSpotifyUrl(url);

    if (!parsed) {
        render(
            '\n' +
            c.red('  Invalid Spotify URL\n\n') +
            c.dim('  Supported formats:\n') +
            c.dim('    open.spotify.com/track/...\n') +
            c.dim('    open.spotify.com/album/...\n') +
            c.dim('    open.spotify.com/playlist/...\n\n') +
            c.dim('  Press Enter to go back')
        );

        return new Promise((resolve) => {
            input.clearHandlers();
            input.on('return', () => { input.clearHandlers(); resolve(); });
            input.on('escape', () => { input.clearHandlers(); resolve(); });
        });
    }

    // Fetch metadata
    const typeLabel = parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1);
    render('\n' + c.cyan(`  Fetching ${typeLabel.toLowerCase()} info...`));

    let data;
    try {
        switch (parsed.type) {
            case 'track':
                data = await spotify.getTrack(parsed.id);
                break;
            case 'playlist':
                data = await spotify.getPlaylist(parsed.id);
                break;
            case 'album':
                data = await spotify.getAlbum(parsed.id);
                break;
        }
    } catch (err) {
        render(
            '\n' +
            c.red(`  Failed to fetch: ${err.message}\n\n`) +
            c.dim('  Check the URL and try again\n\n') +
            c.dim('  Press Enter to go back')
        );
        return new Promise((resolve) => {
            input.clearHandlers();
            input.on('return', () => { input.clearHandlers(); resolve(); });
            input.on('escape', () => { input.clearHandlers(); resolve(); });
        });
    }

    // For single track, show preview first
    if (parsed.type === 'track') {
        const confirmed = await showTrackPreview(data, input);
        if (confirmed) {
            await handleTracks([data], 'track', config, input);
        }
    } else {
        await handleTracks(data, parsed.type, config, input);
    }
}

/**
 * Show a preview of a single track before downloading
 */
async function showTrackPreview(track, input) {
    return new Promise((resolve) => {
        let content = '\n';
        content += c.brightCyan('  Track found\n');
        content += c.dim('  ─────────────────────────────────────────────────────\n\n');
        content += `  ${c.brightWhite(track.title)}\n`;
        content += `  ${c.cyan(track.artist)}\n`;
        content += `  ${c.dim(track.album)}`;
        if (track.releaseDate) content += c.dim(`  (${track.releaseDate.slice(0, 4)})`);
        content += '\n';
        content += `  ${c.dim(formatDuration(track.duration))}\n`;
        content += '\n';
        content += c.dim('  ─────────────────────────────────────────────────────\n');
        content += '\n';
        content += c.dim('  Enter download | Esc back');

        render(content);

        input.clearHandlers();
        input.on('return', () => { input.clearHandlers(); resolve(true); });
        input.on('escape', () => { input.clearHandlers(); resolve(false); });
    });
}

/**
 * Handle track selection and download flow
 */
async function handleTracks(data, type, config, input) {
    // Show track list for selection (for playlists/albums)
    const selectedTracks = await showTrackList(data, type, input);
    if (!selectedTracks || selectedTracks.length === 0) return;

    // Download
    const startTime = Date.now();
    const results = await showDownloading(selectedTracks, config.downloadDir);

    // Show completion
    const action = await showComplete(results, config.downloadDir, startTime, input);
    if (action === 'quit') {
        cursor.show();
        input.destroy();
        process.exit(0);
    }
}

/**
 * Prompt for Spotify credentials on first run
 */
async function promptCredentials(input, config) {
    render(
        '\n' +
        c.brightCyan('  Welcome to ssdl!\n\n') +
        c.white('  To get started, you need Spotify API credentials.\n\n') +
        c.dim('  1. Go to ') + c.cyan('https://developer.spotify.com/dashboard') + '\n' +
        c.dim('  2. Create a new app\n') +
        c.dim('  3. Copy your Client ID and Client Secret\n\n')
    );

    // Get Client ID
    const clientId = await textInput(input, (text) => {
        let content = '\n';
        content += c.brightCyan('  Spotify Setup\n\n');
        content += c.dim('  Create an app at: ') + c.cyan('https://developer.spotify.com/dashboard\n\n');
        content += c.white('  Enter your Client ID:\n');
        content += `  > ${text}${c.dim('█')}\n`;
        render(content);
    });

    if (!clientId) {
        console.log(c.red('\n  Setup cancelled.\n'));
        process.exit(1);
    }

    // Get Client Secret
    const clientSecret = await textInput(input, (text) => {
        let content = '\n';
        content += c.brightCyan('  Spotify Setup\n\n');
        content += c.green(`  ✓  Client ID: ${clientId.slice(0, 8)}...\n\n`);
        content += c.white('  Enter your Client Secret:\n');
        content += `  > ${text}${c.dim('█')}\n`;
        render(content);
    });

    if (!clientSecret) {
        console.log(c.red('\n  Setup cancelled.\n'));
        process.exit(1);
    }

    // Save credentials
    config.spotifyClientId = clientId.trim();
    config.spotifyClientSecret = clientSecret.trim();
    saveConfig(config);

    render('\n' + c.green('  ✓  Credentials saved to ~/.ssdl/config.json\n'));
    await new Promise(r => setTimeout(r, 1000));
}

/**
 * Settings screen
 */
async function showSettings(input, config) {
    const items = [
        { label: `Download directory: ${c.cyan(config.downloadDir)}`, value: 'downloadDir' },
        { label: `Reset Spotify credentials`, value: 'resetCreds' },
        { label: `Back`, value: 'back' },
    ];

    const { menuSelect } = await import('./tui/input.js');

    const selectedIdx = await menuSelect(items, input, (items, selected) => {
        let content = '\n';
        content += c.brightCyan('  Settings\n\n');

        items.forEach((item, i) => {
            const prefix = i === selected ? c.brightCyan('  ❯ ') : '    ';
            const label = i === selected ? c.brightWhite(item.label) : item.label;
            content += `${prefix}${label}\n`;
        });

        content += '\n' + c.dim('  ↑/↓ navigate │ Enter select │ Esc back');
        render(content);
    });

    if (selectedIdx === -1 || items[selectedIdx].value === 'back') return;

    if (items[selectedIdx].value === 'downloadDir') {
        const newDir = await textInput(input, (text) => {
            let content = '\n';
            content += c.brightCyan('  Set download directory:\n\n');
            content += `  > ${text}${c.dim('█')}\n\n`;
            content += c.dim(`  Current: ${config.downloadDir}\n`);
            content += c.dim('  Press Enter to save, Esc to cancel\n');
            render(content);
        }, config.downloadDir);

        if (newDir) {
            config.downloadDir = newDir.trim();
            saveConfig(config);
            render('\n' + c.green('  ✓  Download directory updated!\n'));
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    if (items[selectedIdx].value === 'resetCreds') {
        config.spotifyClientId = '';
        config.spotifyClientSecret = '';
        saveConfig(config);
        render('\n' + c.green('  ✓  Credentials cleared. You\'ll be prompted on next run.\n'));
        await new Promise(r => setTimeout(r, 1500));
    }
}
