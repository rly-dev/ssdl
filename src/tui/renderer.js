import { COLORS, BOX, SYMBOLS } from '../constants.js';

// ─── Cursor Control ──────────────────────────────────────
export const cursor = {
    hide: () => process.stdout.write('\x1b[?25l'),
    show: () => process.stdout.write('\x1b[?25h'),
    moveTo: (row, col) => process.stdout.write(`\x1b[${row};${col}H`),
    moveUp: (n = 1) => process.stdout.write(`\x1b[${n}A`),
    moveDown: (n = 1) => process.stdout.write(`\x1b[${n}B`),
    saveCursor: () => process.stdout.write('\x1b[s'),
    restoreCursor: () => process.stdout.write('\x1b[u'),
};

// ─── Screen Control ──────────────────────────────────────
export const screen = {
    clear: () => process.stdout.write('\x1b[2J\x1b[H'),
    clearLine: () => process.stdout.write('\x1b[2K'),
    clearDown: () => process.stdout.write('\x1b[J'),
    getSize: () => ({
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24,
    }),
};

// ─── Color Helpers ───────────────────────────────────────
export const c = {
    reset: (str) => `${COLORS.reset}${str}${COLORS.reset}`,
    bold: (str) => `${COLORS.bold}${str}${COLORS.reset}`,
    dim: (str) => `${COLORS.dim}${str}${COLORS.reset}`,
    italic: (str) => `${COLORS.italic}${str}${COLORS.reset}`,

    red: (str) => `${COLORS.red}${str}${COLORS.reset}`,
    green: (str) => `${COLORS.green}${str}${COLORS.reset}`,
    yellow: (str) => `${COLORS.yellow}${str}${COLORS.reset}`,
    blue: (str) => `${COLORS.blue}${str}${COLORS.reset}`,
    magenta: (str) => `${COLORS.magenta}${str}${COLORS.reset}`,
    cyan: (str) => `${COLORS.cyan}${str}${COLORS.reset}`,
    white: (str) => `${COLORS.white}${str}${COLORS.reset}`,

    brightGreen: (str) => `${COLORS.brightGreen}${str}${COLORS.reset}`,
    brightCyan: (str) => `${COLORS.brightCyan}${str}${COLORS.reset}`,
    brightYellow: (str) => `${COLORS.brightYellow}${str}${COLORS.reset}`,
    brightMagenta: (str) => `${COLORS.brightMagenta}${str}${COLORS.reset}`,
    brightBlue: (str) => `${COLORS.brightBlue}${str}${COLORS.reset}`,
    brightWhite: (str) => `${COLORS.brightWhite}${str}${COLORS.reset}`,

    // Gradient-ish effect using bright colors
    gradient: (str) => `${COLORS.brightCyan}${str}${COLORS.reset}`,
};

// ─── Box Drawing ─────────────────────────────────────────
export function drawBox(text, options = {}) {
    const { width = 45, padding = 1 } = options;
    const innerWidth = width - 2;
    const lines = [];

    // Top border
    lines.push(c.cyan(`${BOX.topLeft}${BOX.horizontal.repeat(innerWidth)}${BOX.topRight}`));

    // Padding top
    for (let i = 0; i < padding; i++) {
        lines.push(c.cyan(`${BOX.vertical}${' '.repeat(innerWidth)}${BOX.vertical}`));
    }

    // Content lines
    const textLines = Array.isArray(text) ? text : [text];
    for (const line of textLines) {
        const stripped = stripAnsi(line);
        const padLen = Math.max(0, innerWidth - stripped.length);
        const leftPad = Math.floor(padLen / 2);
        const rightPad = padLen - leftPad;
        lines.push(
            c.cyan(BOX.vertical) +
            ' '.repeat(leftPad) + line + ' '.repeat(rightPad) +
            c.cyan(BOX.vertical)
        );
    }

    // Padding bottom
    for (let i = 0; i < padding; i++) {
        lines.push(c.cyan(`${BOX.vertical}${' '.repeat(innerWidth)}${BOX.vertical}`));
    }

    // Bottom border
    lines.push(c.cyan(`${BOX.bottomLeft}${BOX.horizontal.repeat(innerWidth)}${BOX.bottomRight}`));

    return lines.join('\n');
}

// ─── Progress Bar ────────────────────────────────────────
export function progressBar(percent, width = 20) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    const bar = c.brightGreen('█'.repeat(filled)) + c.dim('░'.repeat(empty));
    const pct = `${Math.round(percent)}%`.padStart(4);
    return `[${bar}] ${pct}`;
}

// ─── Table Drawing ───────────────────────────────────────
export function drawTable(headers, rows, options = {}) {
    const { selected = -1, checked = new Set() } = options;

    // Calculate column widths
    const colWidths = headers.map((h, i) => {
        const maxRow = rows.reduce((max, row) => Math.max(max, stripAnsi(String(row[i] || '')).length), 0);
        return Math.max(stripAnsi(h).length, maxRow) + 2;
    });

    const totalWidth = colWidths.reduce((a, b) => a + b, 0) + headers.length + 1;
    const lines = [];

    // Top border
    lines.push(
        c.dim('┌') +
        colWidths.map(w => c.dim('─'.repeat(w))).join(c.dim('┬')) +
        c.dim('┐')
    );

    // Header
    const headerLine = colWidths.map((w, i) => {
        const text = ` ${headers[i]}`;
        return c.bold(c.cyan(text.padEnd(w)));
    }).join(c.dim('│'));
    lines.push(c.dim('│') + headerLine + c.dim('│'));

    // Header separator
    lines.push(
        c.dim('├') +
        colWidths.map(w => c.dim('─'.repeat(w))).join(c.dim('┼')) +
        c.dim('┤')
    );

    // Data rows
    rows.forEach((row, rowIdx) => {
        const isSelected = rowIdx === selected;
        const isChecked = checked.has(rowIdx);

        const rowLine = colWidths.map((w, i) => {
            let text = ` ${String(row[i] || '')}`;
            if (isSelected) {
                text = c.brightCyan(text.padEnd(w));
            } else if (isChecked) {
                text = c.green(text.padEnd(w));
            } else {
                text = text.padEnd(w);
            }
            return text;
        }).join(c.dim('│'));

        const prefix = isSelected ? c.brightCyan('❯') : ' ';
        const checkMark = isChecked ? c.green('✓') : ' ';

        lines.push(c.dim('│') + rowLine + c.dim('│') + ` ${checkMark}`);
    });

    // Bottom border
    lines.push(
        c.dim('└') +
        colWidths.map(w => c.dim('─'.repeat(w))).join(c.dim('┴')) +
        c.dim('┘')
    );

    return lines.join('\n');
}

// ─── Render ──────────────────────────────────────────────
export function render(content) {
    screen.clear();
    process.stdout.write(content + '\n');
}

// ─── Spinner ─────────────────────────────────────────────
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(text) {
    let frameIdx = 0;
    let interval = null;
    let line = 0;

    return {
        start(row = 0) {
            line = row;
            cursor.hide();
            interval = setInterval(() => {
                cursor.moveTo(line, 1);
                screen.clearLine();
                const frame = c.cyan(SPINNER_FRAMES[frameIdx]);
                process.stdout.write(`  ${frame} ${text}`);
                frameIdx = (frameIdx + 1) % SPINNER_FRAMES.length;
            }, 80);
        },
        stop(finalText) {
            if (interval) clearInterval(interval);
            cursor.moveTo(line, 1);
            screen.clearLine();
            if (finalText) {
                process.stdout.write(`  ${c.green('✓')} ${finalText}\n`);
            }
            cursor.show();
        },
    };
}

// ─── Utility: strip ANSI codes for width calculation ─────
export function stripAnsi(str) {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}
