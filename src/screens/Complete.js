import { render, c } from '../tui/renderer.js';
import { formatBytes, formatTime, truncate } from '../utils/format.js';

/**
 * Show the completion screen with download summary
 * @param {object[]} results - Array of download results
 * @param {string} outputDir - Download directory
 * @param {number} startTime - Timestamp when downloads started
 * @returns {Promise<string>} 'back' or 'quit'
 */
export async function showComplete(results, outputDir, startTime, input) {
    const totalTime = (Date.now() - startTime) / 1000;
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalSize = successful.reduce((sum, r) => sum + (r.fileSize || 0), 0);

    return new Promise((resolve) => {
        let content = '\n';

        // Header
        if (failed.length === 0) {
            content += c.brightGreen('  All downloads complete!\n');
        } else if (successful.length > 0) {
            content += c.yellow(`  Downloads finished with ${failed.length} error${failed.length > 1 ? 's' : ''}\n`);
        } else {
            content += c.red('  All downloads failed\n');
        }

        content += c.dim('  ─────────────────────────────────────────────────────\n\n');

        // Successful downloads
        if (successful.length > 0) {
            content += c.dim('  Saved to: ') + c.cyan(outputDir + '/') + '\n\n';

            for (let i = 0; i < successful.length; i++) {
                const r = successful[i];
                const num = c.dim(String(i + 1).padStart(2) + '.');
                const name = truncate(`${r.track.title} — ${r.track.artist}`, 42);
                const size = r.fileSize ? c.dim(formatBytes(r.fileSize)) : '';
                content += `  ${c.green('+')} ${num} ${name}  ${size}\n`;
            }
        }

        // Failed downloads
        if (failed.length > 0) {
            content += '\n';
            content += c.red(`  Failed:\n`);
            for (const r of failed) {
                const name = truncate(`${r.track.title} — ${r.track.artist}`, 42);
                content += `  ${c.red('x')}    ${name}\n`;
                content += c.dim(`         ${r.error}\n`);
            }
        }

        // Summary bar
        content += '\n';
        content += c.dim('  ─────────────────────────────────────────────────────\n');
        const parts = [];
        parts.push(`${successful.length}/${results.length} downloaded`);
        if (totalSize > 0) parts.push(formatBytes(totalSize));
        parts.push(formatTime(totalTime));
        content += `  ${c.brightCyan(parts.join('  |  '))}\n`;

        content += '\n' + c.dim('  Enter go back | Q quit');

        render(content);

        input.clearHandlers();
        input.on('return', () => { input.clearHandlers(); resolve('back'); });
        input.on('q', () => { input.clearHandlers(); resolve('quit'); });
        input.on('Q', () => { input.clearHandlers(); resolve('quit'); });
    });
}
