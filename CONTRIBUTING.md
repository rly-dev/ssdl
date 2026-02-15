# Contributing to ssdl

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to `ssdl` (Spotify Song Downloader). These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## How Can I Contribute?

### Reporting Bugs

Start by searching the [Issues](https://github.com/rly-dev/ssdl/issues) to see if the problem has already been reported. If not, create a new issue and provide the following:
- A clear and descriptive title.
- A description of the steps to reproduce the issue.
- Expected behavior vs. actual behavior.
- Screenshots or terminal output if applicable.
- Your OS version and Node.js version.

### Suggesting Enhancements

If you have an idea for a new feature or improvement:
- specific details about why the change is needed.
- examples of how usage would change (if applicable).

### Pull Requests

1. **Fork the repo** and create your branch from `main`.
2. Please avoid unnecessary dependencies. This project aims to use native Node.js APIs where possible.
3. If you've changed APIs, update the documentation.
4. Ensure your code follows the existing style (ESM, async/await, no semicolons optional but consistent with current codebase).
5. detailed description of your changes.

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/ssdl.git
   cd ssdl
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the CLI locally:
   ```bash
   node bin/cli.js
   ```

## Style Guide

- **Language**: JavaScript (ESM).
- **Formatting**: Use 4 spaces for indentation (as seen in existing files).
- **Core Principle**: Simplicity. Prefer native solutions over adding new npm packages.
