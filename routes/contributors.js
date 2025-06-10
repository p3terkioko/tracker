// tracker/routes/contributors.js
// Endpoint for all contributors with counts.
// Now requires an access token in the request headers.

import express from 'express';
import { getPlaylistTracks } from '../spotify.js'; // Removed PLAYLIST_ID import

const router = express.Router();

router.get('/contributors/:playlistId', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { playlistId } = req.params;

    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized: Access token missing.' });
    }
    if (!playlistId) {
        return res.status(400).json({ error: 'Bad Request: Playlist ID is missing.' });
    }

    try {
        console.log(`Fetching contributors for playlist ${playlistId} for user with token...`);
        const tracks = await getPlaylistTracks(playlistId, accessToken);

        const contributorCounts = {};
        tracks.forEach(track => {
            if (track.added_by && track.added_by.id) {
                const contributorId = track.added_by.id;
                const contributorName = track.added_by.display_name || contributorId;
                contributorCounts[contributorId] = {
                    name: contributorName,
                    count: (contributorCounts[contributorId] ? contributorCounts[contributorId].count : 0) + 1
                };
            }
        });

        const allContributors = Object.values(contributorCounts)
            .sort((a, b) => b.count - a.count);

        res.json(allContributors);

    } catch (error) {
        console.error('Error fetching contributors:', error);
        if (error.message.includes('Unauthorized')) {
            res.status(401).json({ error: 'Unauthorized: Invalid or expired Spotify access token.' });
        } else if (error.message.includes('not found')) {
            res.status(404).json({ error: 'Playlist not found or not accessible.' });
        } else {
            res.status(500).json({ error: 'Failed to fetch contributors data.' });
        }
    }
});

export default router;
