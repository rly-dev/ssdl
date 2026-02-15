/**
 * YouTube Music search — finds the best matching video for a track
 * Uses YouTube Music's public search to avoid needing an API key
 */

const YT_MUSIC_URL = 'https://music.youtube.com';
const YT_SEARCH_URL = 'https://www.youtube.com/results';

/**
 * Search for a track on YouTube and return the best match
 */
export async function searchTrack(title, artist, durationMs) {
    const query = `${title} ${artist}`;

    try {
        // Try YouTube search page scrape
        const result = await searchYouTube(query, durationMs);
        if (result) return result;
    } catch {
        // Fallback: try a simpler search
    }

    // Fallback: use a basic search approach
    return searchYouTubeFallback(query, durationMs);
}

/**
 * Search YouTube by scraping search results page
 */
async function searchYouTube(query, durationMs) {
    const encoded = encodeURIComponent(query);
    const url = `${YT_SEARCH_URL}?search_query=${encoded}`;

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract ytInitialData JSON from the page
    const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (!dataMatch) return null;

    try {
        const data = JSON.parse(dataMatch[1]);
        const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
            ?.sectionListRenderer?.contents;

        if (!contents) return null;

        const videos = [];

        for (const section of contents) {
            const items = section?.itemSectionRenderer?.contents;
            if (!items) continue;

            for (const item of items) {
                const video = item?.videoRenderer;
                if (!video) continue;

                const videoId = video.videoId;
                const videoTitle = video?.title?.runs?.[0]?.text || '';
                const videoDuration = parseDuration(video?.lengthText?.simpleText);

                if (videoId && videoTitle) {
                    videos.push({
                        videoId,
                        title: videoTitle,
                        duration: videoDuration,
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                    });
                }
            }
        }

        if (videos.length === 0) return null;

        // Find best match by duration similarity
        if (durationMs) {
            const targetDuration = durationMs / 1000;
            videos.sort((a, b) => {
                const diffA = Math.abs(a.duration - targetDuration);
                const diffB = Math.abs(b.duration - targetDuration);
                return diffA - diffB;
            });

            // Only accept matches within 10 seconds of target duration
            if (Math.abs(videos[0].duration - targetDuration) <= 10) {
                return videos[0];
            }
        }

        // If no duration match, return first result
        return videos[0];
    } catch {
        return null;
    }
}

/**
 * Fallback: construct a YouTube Music search URL and extract video ID
 * from the redirect
 */
async function searchYouTubeFallback(query, durationMs) {
    const encoded = encodeURIComponent(query + ' audio');
    const url = `${YT_SEARCH_URL}?search_query=${encoded}`;

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract video IDs from the page with regex
    const videoIds = [...html.matchAll(/\"videoId\":\"([a-zA-Z0-9_-]{11})\"/g)]
        .map(m => m[1])
        .filter((id, idx, arr) => arr.indexOf(id) === idx); // unique

    if (videoIds.length === 0) {
        throw new Error(`No YouTube results found for "${query}"`);
    }

    // Return first video
    return {
        videoId: videoIds[0],
        title: query,
        duration: durationMs ? durationMs / 1000 : 0,
        url: `https://www.youtube.com/watch?v=${videoIds[0]}`,
    };
}

/**
 * Parse duration string "M:SS" or "H:MM:SS" to seconds
 */
function parseDuration(str) {
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
}
