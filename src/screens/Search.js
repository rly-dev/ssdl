import { render, c } from '../tui/renderer.js';
import { textInput, menuSelect } from '../tui/input.js';
import { searchTracks } from '../services/spotify.js';
import { formatDuration, truncate } from '../utils/format.js';

/**
 * Show the search screen — search Spotify for tracks
 * @returns {Promise<object|null>} Selected track object, or null if cancelled
 */
export async function showSearch(input) {
    // Step 1: Get search query
    const query = await textInput(input, (text) => {
        let content = '\n';
        content += c.brightCyan('  Search Spotify\n\n');
        content += `  > ${text}${c.dim('|')}\n\n`;

        if (!text.trim()) {
            content += c.dim('  Type a song name, artist, or both\n');
        } else {
            content += c.dim(`  Press Enter to search for "${text}"\n`);
        }

        content += '\n' + c.dim('  Enter search | Esc back');
        render(content);
    });

    if (!query) return null;

    // Step 2: Show loading with dots animation
    render('\n' + c.cyan('  Searching Spotify...'));

    // Step 3: Search Spotify
    let results;
    try {
        results = await searchTracks(query, 10);
    } catch (err) {
        render(
            '\n' +
            c.red(`  Search failed: ${err.message}\n\n`) +
            c.dim('  Press Enter to go back')
        );
        return new Promise((resolve) => {
            input.clearHandlers();
            input.on('return', () => { input.clearHandlers(); resolve(null); });
            input.on('escape', () => { input.clearHandlers(); resolve(null); });
        });
    }

    if (!results || results.length === 0) {
        render(
            '\n' +
            c.yellow(`  No results for "${query}"\n\n`) +
            c.dim('  Try a different search term\n\n') +
            c.dim('  Press Enter to go back')
        );
        return new Promise((resolve) => {
            input.clearHandlers();
            input.on('return', () => { input.clearHandlers(); resolve(null); });
            input.on('escape', () => { input.clearHandlers(); resolve(null); });
        });
    }

    // Step 4: Show results with aligned columns
    const selectedIdx = await menuSelect(results, input, (items, selected) => {
        let content = '\n';
        content += c.brightCyan(`  Results for "${query}"`) + c.dim(`  (${items.length} found)\n\n`);

        // Calculate column widths for alignment
        const maxTitle = 30;
        const maxArtist = 20;

        items.forEach((track, i) => {
            const isActive = i === selected;
            const prefix = isActive ? c.brightCyan('  > ') : '    ';
            const num = c.dim(`${String(i + 1).padStart(2)}.`);
            const title = truncate(track.title, maxTitle);
            const artist = truncate(track.artist, maxArtist);
            const dur = formatDuration(track.duration);

            if (isActive) {
                content += `${prefix}${num} ${c.brightWhite(title.padEnd(maxTitle))}  ${c.cyan(artist.padEnd(maxArtist))}  ${c.dim(dur)}\n`;
            } else {
                content += `${prefix}${num} ${title.padEnd(maxTitle)}  ${c.dim(artist.padEnd(maxArtist))}  ${c.dim(dur)}\n`;
            }
        });

        // Show details of selected track
        const sel = items[selected];
        content += '\n';
        content += c.dim('  ─────────────────────────────────────────────────────\n');
        content += `  ${c.brightWhite(sel.title)}\n`;
        content += `  ${c.cyan(sel.artist)}  ${c.dim('on')}  ${c.dim(sel.album)}\n`;
        content += `  ${c.dim(formatDuration(sel.duration))}\n`;
        content += '\n' + c.dim('  up/down navigate | Enter download | Esc back');
        render(content);
    });

    if (selectedIdx === -1) return null;
    return results[selectedIdx];
}
