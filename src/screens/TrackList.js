import { render, drawTable, c } from '../tui/renderer.js';
import { checkboxSelect } from '../tui/input.js';
import { formatDuration, truncate } from '../utils/format.js';

/**
 * Show the track list / playlist preview with checkbox selection
 * @param {object} data - Playlist/album data with tracks array
 * @param {string} type - 'track' | 'playlist' | 'album'
 * @returns {Promise<object[]|null>} Selected tracks, or null if cancelled
 */
export async function showTrackList(data, type, input) {
    // Single track — data is already an array like [trackObj], return as-is
    if (type === 'track') {
        return data;
    }

    const tracks = data.tracks;

    const selectedSet = await checkboxSelect(tracks, input, (items, selectedIdx, checked) => {
        let content = '\n';

        // Header with metadata
        if (type === 'playlist') {
            content += c.brightCyan(`  Playlist: ${data.name}\n`);
            content += c.dim(`  by ${data.owner}  |  ${tracks.length} tracks`);
            const totalMs = tracks.reduce((s, t) => s + (t.duration || 0), 0);
            content += c.dim(`  |  ${formatDuration(totalMs)} total\n`);
        } else if (type === 'album') {
            content += c.brightCyan(`  Album: ${data.name}\n`);
            content += c.dim(`  by ${data.artist}  |  ${tracks.length} tracks`);
            if (data.releaseDate) content += c.dim(`  |  ${data.releaseDate.slice(0, 4)}`);
            content += '\n';
        }

        content += c.dim('  ─────────────────────────────────────────────────────\n');
        content += '\n';

        // Track table
        const headers = ['', '#', 'Title', 'Artist', 'Time'];
        const rows = items.map((track, i) => [
            checked.has(i) ? c.green('x') : c.dim('-'),
            c.dim(String(i + 1).padStart(2)),
            truncate(track.title, 28),
            truncate(track.artist, 18),
            formatDuration(track.duration),
        ]);

        // Show a window of rows around the selected index (max ~15 visible)
        const maxVisible = Math.min(15, process.stdout.rows - 12);
        let startIdx = Math.max(0, selectedIdx - Math.floor(maxVisible / 2));
        let endIdx = Math.min(rows.length, startIdx + maxVisible);
        if (endIdx - startIdx < maxVisible) {
            startIdx = Math.max(0, endIdx - maxVisible);
        }

        const visibleRows = rows.slice(startIdx, endIdx);
        const adjustedSelected = selectedIdx - startIdx;

        content += drawTable(headers, visibleRows, {
            selected: adjustedSelected,
            checked: new Set(
                [...checked].filter(i => i >= startIdx && i < endIdx).map(i => i - startIdx)
            ),
        });

        content += '\n\n';

        // Status bar
        const selectedCount = checked.size;
        const bar = `  ${c.brightCyan(`${selectedCount}`)}/${tracks.length} selected`;
        const scroll = rows.length > maxVisible
            ? c.dim(`  |  ${startIdx + 1}-${endIdx} of ${rows.length}`)
            : '';
        content += bar + scroll + '\n';

        content += c.dim('  up/down navigate | Space toggle | A select all | Enter download | Esc back');

        render(content);
    });

    if (!selectedSet) return null;

    // Return selected tracks
    return tracks.filter((_, i) => selectedSet.has(i));
}
