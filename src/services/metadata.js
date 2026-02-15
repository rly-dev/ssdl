import NodeID3 from 'node-id3';

/**
 * Embed metadata (ID3 tags) into an MP3 file
 * @param {string} filePath - Path to the MP3 file
 * @param {object} meta - Track metadata
 * @param {string} meta.title - Track title
 * @param {string} meta.artist - Artist name
 * @param {string} meta.album - Album name
 * @param {string} [meta.artworkUrl] - URL to album artwork
 * @param {number} [meta.trackNumber] - Track number
 * @param {string} [meta.releaseDate] - Release date
 */
export async function embedMetadata(filePath, meta) {
    const tags = {
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        trackNumber: meta.trackNumber ? String(meta.trackNumber) : undefined,
        year: meta.releaseDate ? meta.releaseDate.split('-')[0] : undefined,
    };

    // Download and embed album artwork
    if (meta.artworkUrl) {
        try {
            const artworkRes = await fetch(meta.artworkUrl);
            if (artworkRes.ok) {
                const buffer = Buffer.from(await artworkRes.arrayBuffer());
                tags.image = {
                    mime: 'image/jpeg',
                    type: { id: 3, name: 'front cover' },
                    description: 'Album Artwork',
                    imageBuffer: buffer,
                };
            }
        } catch {
            // Skip artwork if download fails — not critical
        }
    }

    // Write tags to file
    const success = NodeID3.write(tags, filePath);
    if (!success) {
        throw new Error(`Failed to write ID3 tags to ${filePath}`);
    }

    return true;
}
