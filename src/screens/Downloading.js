import { render, progressBar, c } from '../tui/renderer.js';
import { searchTrack } from '../services/youtube.js';
import { downloadTrack } from '../services/downloader.js';
import { embedMetadata } from '../services/metadata.js';
import { truncate, formatBytes } from '../utils/format.js';
import { statSync } from 'fs';

/**
 * Show the download progress screen
 * Downloads all selected tracks sequentially
 * @param {object[]} tracks - Array of track metadata
 * @param {string} outputDir - Download directory
 * @returns {Promise<object[]>} Array of download results
 */
export async function showDownloading(tracks, outputDir) {
    const results = [];
    const startTime = Date.now();

    // Status for each track
    const statuses = tracks.map(() => ({
        status: 'queued', percent: 0, message: '', filePath: '', fileSize: 0,
    }));

    function drawProgress() {
        let content = '\n';
        const done = statuses.filter(s => s.status === 'done').length;
        const errors = statuses.filter(s => s.status === 'error').length;
        const elapsed = Math.round((Date.now() - startTime) / 1000);

        // Header with overall progress
        content += c.brightCyan(`  Downloading`) + c.dim(` ${done}/${tracks.length}`) + '\n';
        content += c.dim(`  ─────────────────────────────────────────────────────\n`);

        // Calculate visible window
        const maxVisible = Math.min(tracks.length, Math.max(8, process.stdout.rows - 10));

        // Find the current active track to center view on it
        let activeIdx = statuses.findIndex(s =>
            s.status === 'searching' || s.status === 'downloading' || s.status === 'metadata'
        );
        if (activeIdx === -1) activeIdx = done + errors;

        let startIdx = Math.max(0, activeIdx - Math.floor(maxVisible / 2));
        let endIdx = Math.min(tracks.length, startIdx + maxVisible);
        if (endIdx - startIdx < maxVisible) startIdx = Math.max(0, endIdx - maxVisible);

        for (let i = startIdx; i < endIdx; i++) {
            const track = tracks[i];
            const s = statuses[i];
            const label = truncate(`${track.title} — ${track.artist}`, 36);
            const num = c.dim(String(i + 1).padStart(2) + '.');

            let icon, statusText;

            switch (s.status) {
                case 'queued':
                    icon = c.dim('·');
                    statusText = c.dim('waiting');
                    content += `  ${icon} ${num} ${c.dim(label)}\n`;
                    break;
                case 'searching':
                    icon = c.cyan('~');
                    statusText = c.cyan('finding match...');
                    content += `  ${icon} ${num} ${label}  ${statusText}\n`;
                    break;
                case 'downloading': {
                    icon = c.yellow('>');
                    const bar = progressBar(s.percent, 12);
                    content += `  ${icon} ${num} ${label}\n`;
                    content += `         ${bar}  ${c.dim(s.message || '')}\n`;
                    break;
                }
                case 'metadata':
                    icon = c.cyan('>');
                    statusText = c.cyan('tagging...');
                    content += `  ${icon} ${num} ${c.cyan(label)}  ${statusText}\n`;
                    break;
                case 'done': {
                    icon = c.green('+');
                    const size = s.fileSize > 0 ? c.dim(` ${formatBytes(s.fileSize)}`) : '';
                    content += `  ${icon} ${num} ${c.green(label)}${size}\n`;
                    break;
                }
                case 'error':
                    icon = c.red('x');
                    content += `  ${icon} ${num} ${c.red(label)}  ${c.dim(s.message)}\n`;
                    break;
            }
        }

        // Scroll indicator
        if (tracks.length > maxVisible) {
            content += c.dim(`\n  ... ${startIdx + 1}-${endIdx} of ${tracks.length}\n`);
        }

        // Footer status bar
        content += '\n';
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        content += c.dim(`  Elapsed: ${timeStr}`);
        if (errors > 0) content += c.red(`  |  ${errors} failed`);

        render(content);
    }

    // Download each track sequentially
    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        // Step 1: Find on YouTube
        statuses[i].status = 'searching';
        drawProgress();

        let ytResult;
        try {
            ytResult = await searchTrack(track.title, track.artist, track.duration);
            if (!ytResult) throw new Error('No match found');
        } catch (err) {
            statuses[i].status = 'error';
            statuses[i].message = err.message;
            results.push({ track, success: false, error: err.message });
            drawProgress();
            continue;
        }

        // Step 2: Download from YouTube
        statuses[i].status = 'downloading';
        drawProgress();

        let filePath;
        try {
            filePath = await downloadTrack(ytResult.url, track, outputDir, (percent, msg) => {
                statuses[i].percent = percent;
                statuses[i].message = msg;
                drawProgress();
            });
        } catch (err) {
            statuses[i].status = 'error';
            statuses[i].message = err.message;
            results.push({ track, success: false, error: err.message });
            drawProgress();
            continue;
        }

        // Step 3: Embed metadata
        statuses[i].status = 'metadata';
        drawProgress();

        try {
            await embedMetadata(filePath, track);
        } catch {
            // Metadata failure is non-critical
        }

        // Done
        statuses[i].status = 'done';
        statuses[i].filePath = filePath;
        try {
            statuses[i].fileSize = statSync(filePath).size;
        } catch {
            statuses[i].fileSize = 0;
        }

        results.push({
            track,
            success: true,
            filePath,
            fileSize: statuses[i].fileSize,
        });

        drawProgress();
    }

    return results;
}
