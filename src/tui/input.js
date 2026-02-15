import readline from 'readline';

// ─── Key Input Handler ───────────────────────────────────
// Creates a raw-mode key listener that dispatches to callbacks
export function createInputHandler() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });

    // Enable raw mode for keypress detection
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    readline.emitKeypressEvents(process.stdin, rl);

    const handlers = {};
    let textBuffer = '';
    let textMode = false;
    let textCallback = null;
    let textRenderCallback = null;

    process.stdin.on('keypress', (str, key) => {
        if (!key) return;

        // Ctrl+C always exits
        if (key.ctrl && key.name === 'c') {
            cleanup();
            process.exit(0);
        }

        // Text input mode
        if (textMode) {
            if (key.name === 'return') {
                textMode = false;
                if (textCallback) textCallback(textBuffer);
                return;
            }
            if (key.name === 'escape') {
                textMode = false;
                textBuffer = '';
                if (handlers['escape']) handlers['escape']();
                return;
            }
            if (key.name === 'backspace') {
                textBuffer = textBuffer.slice(0, -1);
                if (textRenderCallback) textRenderCallback(textBuffer);
                return;
            }
            if (str && !key.ctrl && !key.meta) {
                textBuffer += str;
                if (textRenderCallback) textRenderCallback(textBuffer);
                return;
            }
            return;
        }

        // Navigation mode
        const keyName = key.name;
        if (handlers[keyName]) {
            handlers[keyName](key);
        }
        if (key.name === 'space' && handlers['space']) {
            handlers['space'](key);
        }
        if (str === 'a' && handlers['a']) handlers['a'](key);
        if (str === 'A' && handlers['A']) handlers['A'](key);
        if (str === 'q' && handlers['q']) handlers['q'](key);
        if (str === 'Q' && handlers['Q']) handlers['Q'](key);
    });

    function cleanup() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        rl.close();
    }

    return {
        // Register a key handler
        on(keyName, callback) {
            handlers[keyName] = callback;
            return this;
        },

        // Remove a key handler
        off(keyName) {
            delete handlers[keyName];
            return this;
        },

        // Clear all handlers
        clearHandlers() {
            for (const key of Object.keys(handlers)) {
                delete handlers[key];
            }
            return this;
        },

        // Enter text input mode
        startTextInput(initialValue = '', onChange, onSubmit) {
            textBuffer = initialValue;
            textMode = true;
            textCallback = onSubmit;
            textRenderCallback = onChange;
        },

        // Exit text input mode
        stopTextInput() {
            textMode = false;
            textBuffer = '';
            textCallback = null;
            textRenderCallback = null;
        },

        // Get current text buffer
        getTextBuffer() {
            return textBuffer;
        },

        // Cleanup
        destroy() {
            cleanup();
        },
    };
}

// ─── Simple Menu Selector ────────────────────────────────
// Returns a promise that resolves with the selected index
export function menuSelect(items, input, renderFn) {
    return new Promise((resolve) => {
        let selectedIdx = 0;

        function draw() {
            renderFn(items, selectedIdx);
        }

        input.clearHandlers();

        input.on('up', () => {
            selectedIdx = (selectedIdx - 1 + items.length) % items.length;
            draw();
        });

        input.on('down', () => {
            selectedIdx = (selectedIdx + 1) % items.length;
            draw();
        });

        input.on('return', () => {
            input.clearHandlers();
            resolve(selectedIdx);
        });

        input.on('escape', () => {
            input.clearHandlers();
            resolve(-1);
        });

        draw();
    });
}

// ─── Checkbox Selector ───────────────────────────────────
// Returns a promise that resolves with a Set of selected indices
export function checkboxSelect(items, input, renderFn) {
    return new Promise((resolve) => {
        let selectedIdx = 0;
        const checked = new Set();

        // Start with all checked
        items.forEach((_, i) => checked.add(i));

        function draw() {
            renderFn(items, selectedIdx, checked);
        }

        input.clearHandlers();

        input.on('up', () => {
            selectedIdx = (selectedIdx - 1 + items.length) % items.length;
            draw();
        });

        input.on('down', () => {
            selectedIdx = (selectedIdx + 1) % items.length;
            draw();
        });

        input.on('space', () => {
            if (checked.has(selectedIdx)) {
                checked.delete(selectedIdx);
            } else {
                checked.add(selectedIdx);
            }
            draw();
        });

        input.on('a', () => {
            if (checked.size === items.length) {
                checked.clear();
            } else {
                items.forEach((_, i) => checked.add(i));
            }
            draw();
        });

        input.on('return', () => {
            input.clearHandlers();
            resolve(checked);
        });

        input.on('escape', () => {
            input.clearHandlers();
            resolve(null);
        });

        draw();
    });
}

// ─── Text Input ──────────────────────────────────────────
// Returns a promise that resolves with the entered text
export function textInput(input, renderFn, initialValue = '') {
    return new Promise((resolve) => {
        input.clearHandlers();

        input.startTextInput(
            initialValue,
            (text) => renderFn(text),    // onChange
            (text) => {                  // onSubmit
                input.clearHandlers();
                resolve(text);
            }
        );

        input.on('escape', () => {
            input.stopTextInput();
            input.clearHandlers();
            resolve(null);
        });

        // Initial render
        renderFn(initialValue);
    });
}
