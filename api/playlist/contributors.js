import { getPlaylistTracks } from '../../spotify.js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const { playlistId } = req.query;

  if (!accessToken) {
    res.status(401).json({ error: 'Unauthorized: Access token missing.' });
    return;
  }
  if (!playlistId) {
    res.status(400).json({ error: 'Bad Request: Playlist ID is missing.' });
    return;
  }

  try {
    const tracks = await getPlaylistTracks(playlistId, accessToken);
    const contributorCounts = {};
    for (const track of tracks) {
      if (track.added_by && track.added_by.id) {
        const contributorId = track.added_by.id;
        // Try to resolve display name from Spotify API
        let contributorName = track.added_by.display_name || contributorId;
        if (!track.added_by.display_name) {
          try {
            const response = await fetch(
              `https://api.spotify.com/v1/users/${contributorId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (response.ok) {
              const profile = await response.json();
              contributorName = profile.display_name || contributorId;
            }
          } catch {}
        }
        contributorCounts[contributorId] = {
          name: contributorName,
          count: contributorCounts[contributorId]
            ? contributorCounts[contributorId].count + 1
            : 1,
        };
      }
    }
    const allContributors = Object.values(contributorCounts).sort(
      (a, b) => b.count - a.count
    );
    res.json(allContributors);
  } catch (error) {
    if (error.message && error.message.includes('Unauthorized')) {
      res.status(401).json({
        error: 'Unauthorized: Invalid or expired Spotify access token.',
      });
    } else if (error.message && error.message.includes('not found')) {
      res.status(404).json({ error: 'Playlist not found or not accessible.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch contributors data.' });
    }
  }
}
