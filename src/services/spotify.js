import { SPOTIFY_TOKEN_URL, SPOTIFY_API_BASE } from '../constants.js';

let accessToken = null;
let tokenExpiry = 0;

/**
 * Authenticate with Spotify using Client Credentials flow
 */
export async function authenticate(clientId, clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Spotify auth failed: ${err.error_description || res.statusText}`);
    }

    const data = await res.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early

    return accessToken;
}

/**
 * Check if the current token is still valid
 */
export function isAuthenticated() {
    return accessToken && Date.now() < tokenExpiry;
}

/**
 * Make an authenticated request to the Spotify API
 */
async function spotifyFetch(endpoint) {
    if (!accessToken) {
        throw new Error('Not authenticated. Call authenticate() first.');
    }

    const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (res.status === 401) {
        throw new Error('Spotify token expired. Re-authenticate.');
    }

    if (!res.ok) {
        throw new Error(`Spotify API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

/**
 * Parse a Spotify URL and extract type + ID
 * Supports:
 *   https://open.spotify.com/track/ID
 *   https://open.spotify.com/album/ID
 *   https://open.spotify.com/playlist/ID
 *   spotify:track:ID
 */
export function parseSpotifyUrl(url) {
    // Web URL format
    const webMatch = url.match(
        /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/
    );
    if (webMatch) {
        return { type: webMatch[1], id: webMatch[2] };
    }

    // URI format (spotify:track:ID)
    const uriMatch = url.match(
        /spotify:(track|album|playlist):([a-zA-Z0-9]+)/
    );
    if (uriMatch) {
        return { type: uriMatch[1], id: uriMatch[2] };
    }

    return null;
}

/**
 * Get a single track's metadata
 */
export async function getTrack(id) {
    const data = await spotifyFetch(`/tracks/${id}`);

    return {
        id: data.id,
        title: data.name,
        artist: data.artists.map(a => a.name).join(', '),
        album: data.album.name,
        duration: data.duration_ms,
        artworkUrl: data.album.images?.[0]?.url || null,
        releaseDate: data.album.release_date,
        trackNumber: data.track_number,
        url: data.external_urls?.spotify,
    };
}

/**
 * Get a playlist's metadata and all tracks
 */
export async function getPlaylist(id) {
    const data = await spotifyFetch(`/playlists/${id}`);

    let tracks = data.tracks.items
        .filter(item => item.track)
        .map(item => ({
            id: item.track.id,
            title: item.track.name,
            artist: item.track.artists.map(a => a.name).join(', '),
            album: item.track.album.name,
            duration: item.track.duration_ms,
            artworkUrl: item.track.album.images?.[0]?.url || null,
            releaseDate: item.track.album.release_date,
            trackNumber: item.track.track_number,
            url: item.track.external_urls?.spotify,
        }));

    // Handle pagination — playlists can have > 100 tracks
    let next = data.tracks.next;
    while (next) {
        const nextUrl = next.replace(SPOTIFY_API_BASE, '');
        const nextData = await spotifyFetch(nextUrl);
        const moreTracks = nextData.items
            .filter(item => item.track)
            .map(item => ({
                id: item.track.id,
                title: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', '),
                album: item.track.album.name,
                duration: item.track.duration_ms,
                artworkUrl: item.track.album.images?.[0]?.url || null,
                releaseDate: item.track.album.release_date,
                trackNumber: item.track.track_number,
                url: item.track.external_urls?.spotify,
            }));
        tracks = tracks.concat(moreTracks);
        next = nextData.next;
    }

    return {
        name: data.name,
        description: data.description,
        owner: data.owner.display_name,
        totalTracks: tracks.length,
        artworkUrl: data.images?.[0]?.url || null,
        tracks,
    };
}

/**
 * Get an album's metadata and all tracks
 */
export async function getAlbum(id) {
    const data = await spotifyFetch(`/albums/${id}`);

    const tracks = data.tracks.items.map(item => ({
        id: item.id,
        title: item.name,
        artist: item.artists.map(a => a.name).join(', '),
        album: data.name,
        duration: item.duration_ms,
        artworkUrl: data.images?.[0]?.url || null,
        releaseDate: data.release_date,
        trackNumber: item.track_number,
        url: item.external_urls?.spotify,
    }));

    return {
        name: data.name,
        artist: data.artists.map(a => a.name).join(', '),
        totalTracks: tracks.length,
        releaseDate: data.release_date,
        artworkUrl: data.images?.[0]?.url || null,
        tracks,
    };
}

/**
 * Search Spotify for tracks
 */
export async function searchTracks(query, limit = 10) {
    const encoded = encodeURIComponent(query);
    const data = await spotifyFetch(`/search?q=${encoded}&type=track&limit=${limit}`);

    return data.tracks.items.map(item => ({
        id: item.id,
        title: item.name,
        artist: item.artists.map(a => a.name).join(', '),
        album: item.album.name,
        duration: item.duration_ms,
        artworkUrl: item.album.images?.[0]?.url || null,
        url: item.external_urls?.spotify,
    }));
}
