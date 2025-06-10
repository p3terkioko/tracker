// tracker/routes/tracks.js
// Endpoint for all track details.
// Now requires an access token in the request headers.

import express from 'express';
import { getPlaylistTracks } from '../spotify.js'; // Removed PLAYLIST_ID import

const router = express.Router();

router.get('/tracks/:playlistId', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { playlistId } = req.params;

    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized: Access token missing.' });
    }
    if (!playlistId) {
        return res.status(400).json({ error: 'Bad Request: Playlist ID is missing.' });
    }

    try {
        console.log(`Fetching tracks for playlist ${playlistId} for user with token...`);
        const tracks = await getPlaylistTracks(playlistId, accessToken);

        const trackDetails = tracks.map(track => ({
            name: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            album: track.album ? track.album.name : 'Unknown Album',
            release_date: track.album ? track.album.release_date : 'Unknown Date',
            spotify_url: track.external_urls ? track.external_urls.spotify : '#',
        }));

        res.json(trackDetails);

    } catch (error) {
        console.error('Error fetching tracks:', error);
        if (error.message.includes('Unauthorized')) {
            res.status(401).json({ error: 'Unauthorized: Invalid or expired Spotify access token.' });
        } else if (error.message.includes('not found')) {
            res.status(404).json({ error: 'Playlist not found or not accessible.' });
        } else {
            res.status(500).json({ error: 'Failed to fetch track data.' });
        }
    }
});

export default router;
