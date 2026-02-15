import { render, c } from '../tui/renderer.js';
import { textInput } from '../tui/input.js';
import { parseSpotifyUrl } from '../services/spotify.js';

/**
 * Show the URL input screen with live validation
 * @returns {Promise<string|null>} The entered URL, or null if cancelled
 */
export async function showURLInput(input) {
    const url = await textInput(input, (text) => {
        let content = '\n';
        content += c.brightCyan('  Paste a Spotify URL\n\n');

        // URL input with live validation indicator
        const parsed = text.trim() ? parseSpotifyUrl(text.trim()) : null;
        const cursor = c.dim('|');

        if (!text.trim()) {
            content += c.dim('  > ') + cursor + '\n';
            content += '\n';
            content += c.dim('  Supported:\n');
            content += c.dim('    open.spotify.com/track/...\n');
            content += c.dim('    open.spotify.com/album/...\n');
            content += c.dim('    open.spotify.com/playlist/...\n');
        } else if (parsed) {
            const typeLabel = parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1);
            content += c.green('  > ') + `${text}${cursor}\n`;
            content += '\n';
            content += c.green(`  Valid ${typeLabel} URL detected\n`);
        } else {
            content += c.red('  > ') + `${text}${cursor}\n`;
            content += '\n';
            content += c.red('  Not a valid Spotify URL\n');
        }

        content += '\n' + c.dim('  Enter continue | Esc back');
        render(content);
    });

    return url && url.trim() ? url.trim() : null;
}
