# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-15

### Added
- **Interactive CLI**: Full feature Terminal User Interface (TUI) built from scratch using ANSI escape codes.
- **Spotify Authentication**: Client Credentials flow implementation with auto-refreshing tokens.
- **Download Functionality**:
    - Support for Spotify Tracks, Albums, and Playlists.
    - Automated search and matching on YouTube.
    - High-quality audio download using `yt-dlp`.
    - Parallel downloads with concurrent progress bars.
- **Metadata Embedding**:
    - Writes ID3 tags (Title, Artist, Album).
    - Downloads and embeds album artwork.
- **Search**: Built-in Spotify track search functionality.
- **Utilities**:
    - Configuration management (`~/.ssdl/config.json`).
    - Dependency checking (`yt-dlp` and `ffmpeg`).
- **User Experience**:
    - Live URL validation.
    - "From scratch" TUI components (Spinner, ProgressBar, Table, Box).
    - Track preview/confirmation for single downloads.
