# 🎵 ssdl — Spotify Song Downloader

> [!WARNING]
> This tool is for **educational purposes only**. It downloads audio from YouTube, not Spotify source files.
> Please respect the copyright laws in your jurisdiction and support the artists by streaming or purchasing their music.

A CLI tool to download songs and playlists from Spotify. Built from scratch with zero runtime npm dependencies (except `node-id3` for ID3 tags).

## TUI Preview

The interface is built with a custom TUI engine for a seamless user experience:

```
  ███████╗███████╗██████╗ ██╗     
  ██╔════╝██╔════╝██╔══██╗██║     
  ███████╗███████╗██║  ██║██║     
  ╚════██║╚════██║██║  ██║██║     
  ███████║███████║██████╔╝███████╗
  ╚══════╝╚══════╝╚═════╝ ╚══════╝
  Spotify Song Downloader          v1.0.0
  ────────────────────────────────────

  > Paste a Spotify URL (track/playlist/album)
    Search for a song
    Settings
    Exit
```

**Live Download Progress:**

```
  Downloading 12 tracks...
  ─────────────────────────────────────────────────────
  · 01. Intro                         waiting
  ~ 02. Track Title                   finding match...
  > 03. Another Track
         [████████░░░░] 65%  Downloading...
  + 04. Already Done                  3.4 MB
```

## How It Works

1. **Spotify API** → fetches track metadata (title, artist, album, artwork)
2. **YouTube matching** → searches YouTube for the best audio match
3. **yt-dlp** → downloads audio as MP3
4. **Metadata embedding** → writes ID3 tags + album art into the file

## Install & Run

```bash
npx ssdl
```

Or clone and run locally:

```bash
git clone https://github.com/rly-dev/ssdl.git
cd ssdl
npm install
node bin/cli.js
```

## Requirements

- **Node.js** ≥ 18.0.0
- **yt-dlp** — [install guide](https://github.com/yt-dlp/yt-dlp#installation)
- **ffmpeg** — [install guide](https://ffmpeg.org/download.html)

## First-Time Setup

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your **Client ID** and **Client Secret**
4. Run `ssdl` — you'll be prompted to enter them
5. Credentials are saved to `~/.ssdl/config.json`

## Usage

```bash
# Interactive mode — full TUI with menus
ssdl

# Direct download — skip to download
ssdl https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT

# Playlist
ssdl https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M

# Album
ssdl https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy
```

## Features

- 🎵 Download individual tracks, albums, or entire playlists
- 🔍 Search Spotify directly from the CLI
- 📋 Select specific tracks from playlists with checkboxes
- 📊 Live download progress with progress bars
- 🏷️ Auto-embeds ID3 tags (title, artist, album, artwork)
- ⚙️ Configurable download directory and settings
- 🚀 Zero wrapper libraries — built from scratch with native Node.js APIs

## License

[Apache 2.0](LICENSE)
