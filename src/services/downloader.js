import { spawn } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { sanitizeFilename } from '../utils/format.js';

/**
 * Download a track from YouTube using yt-dlp
 * @param {string} youtubeUrl - YouTube video URL
 * @param {object} trackInfo - Track metadata { title, artist }
 * @param {string} outputDir - Directory to save the file
 * @param {function} onProgress - Callback with (percent, status)
 * @returns {Promise<string>} - Path to the downloaded file
 */
export async function downloadTrack(youtubeUrl, trackInfo, outputDir, onProgress) {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const filename = sanitizeFilename(`${trackInfo.title} — ${trackInfo.artist}`);
    const outputPath = join(outputDir, `${filename}.%(ext)s`);
    const expectedPath = join(outputDir, `${filename}.mp3`);

    return new Promise((resolve, reject) => {
        const args = [
            youtubeUrl,
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',           // Best quality
            '--output', outputPath,
            '--no-playlist',
            '--no-warnings',
            '--progress',
            '--newline',                       // Each progress update on a new line
            '--no-check-certificates',
        ];

        const proc = spawn('yt-dlp', args, {
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        let lastPercent = 0;
        let stderr = '';

        proc.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                // Parse progress lines like: [download]  45.2% of  4.81MiB at  1.23MiB/s ETA 00:03
                const progressMatch = line.match(/\[download\]\s+([\d.]+)%/);
                if (progressMatch) {
                    const percent = parseFloat(progressMatch[1]);
                    if (percent > lastPercent) {
                        lastPercent = percent;
                        if (onProgress) onProgress(percent, 'Downloading...');
                    }
                }

                // Post-processing indication
                if (line.includes('[ExtractAudio]') || line.includes('Post-process')) {
                    if (onProgress) onProgress(lastPercent, 'Converting...');
                }
            }
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                if (onProgress) onProgress(100, 'Done');
                resolve(expectedPath);
            } else {
                reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
            }
        });

        proc.on('error', (err) => {
            reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
        });
    });
}

/**
 * Get the file size of a downloaded file
 */
export function getFileSize(filePath) {
    try {
        return statSync(filePath).size;
    } catch {
        return 0;
    }
}
