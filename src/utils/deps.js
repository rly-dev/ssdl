import { execSync } from 'child_process';
import { c } from '../tui/renderer.js';

/**
 * Check if required system dependencies are available
 * Returns { ok: boolean, missing: string[] }
 */
export function checkDeps() {
    const deps = ['yt-dlp', 'ffmpeg'];
    const missing = [];

    for (const dep of deps) {
        try {
            execSync(`which ${dep}`, { stdio: 'ignore' });
        } catch {
            missing.push(dep);
        }
    }

    return {
        ok: missing.length === 0,
        missing,
    };
}

/**
 * Print install instructions for missing dependencies
 */
export function printDepInstructions(missing) {
    console.log('');
    console.log(c.red('  ✗ Missing required dependencies:'));
    console.log('');

    for (const dep of missing) {
        console.log(c.yellow(`    • ${dep}`));

        if (dep === 'yt-dlp') {
            console.log(c.dim('      Install: pip install yt-dlp'));
            console.log(c.dim('      Or:      brew install yt-dlp'));
            console.log(c.dim('      Docs:    https://github.com/yt-dlp/yt-dlp#installation'));
        }

        if (dep === 'ffmpeg') {
            console.log(c.dim('      Install: sudo apt install ffmpeg'));
            console.log(c.dim('      Or:      brew install ffmpeg'));
            console.log(c.dim('      Docs:    https://ffmpeg.org/download.html'));
        }

        console.log('');
    }
}
