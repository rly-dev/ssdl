import { render, c } from '../tui/renderer.js';
import { menuSelect } from '../tui/input.js';
import { APP_VERSION } from '../constants.js';

const BANNER = [
    '  ███████╗███████╗██████╗ ██╗     ',
    '  ██╔════╝██╔════╝██╔══██╗██║     ',
    '  ███████╗███████╗██║  ██║██║     ',
    '  ╚════██║╚════██║██║  ██║██║     ',
    '  ███████║███████║██████╔╝███████╗',
    '  ╚══════╝╚══════╝╚═════╝ ╚══════╝',
];

const MENU_ITEMS = [
    { label: 'Paste a Spotify URL (track/playlist/album)', value: 'url' },
    { label: 'Search for a song', value: 'search' },
    { label: 'Settings', value: 'settings' },
    { label: 'Exit', value: 'exit' },
];

/**
 * Show the welcome screen with main menu
 * @returns {Promise<string>} Selected action: 'url' | 'search' | 'settings' | 'exit'
 */
export async function showWelcome(input) {
    const selectedIdx = await menuSelect(MENU_ITEMS, input, (items, selected) => {
        let content = '\n';

        // Banner with gradient
        const grad = [
            '\x1b[38;5;43m',   // teal
            '\x1b[38;5;44m',   // cyan
            '\x1b[38;5;45m',   // bright cyan
            '\x1b[38;5;44m',   // cyan
            '\x1b[38;5;43m',   // teal
            '\x1b[38;5;42m',   // green-teal
        ];
        const reset = '\x1b[0m';

        content += BANNER.map((line, i) => `${grad[i]}${line}${reset}`).join('\n');
        content += '\n';
        content += c.dim('  Spotify Song Downloader') + c.dim(`${' '.repeat(10)}v${APP_VERSION}`) + '\n';
        content += c.dim('  ────────────────────────────────────') + '\n\n';

        items.forEach((item, i) => {
            const prefix = i === selected
                ? c.brightCyan('  > ')
                : '    ';
            const label = i === selected
                ? c.brightWhite(item.label)
                : c.dim(item.label);
            content += `${prefix}${label}\n`;
        });

        content += '\n' + c.dim('  up/down navigate | Enter select | Ctrl+C quit');

        render(content);
    });

    if (selectedIdx === -1) return 'exit';
    return MENU_ITEMS[selectedIdx].value;
}
