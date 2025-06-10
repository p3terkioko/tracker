import { getPlaylistTracks } from '../../spotify.js';

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
    // ...existing logic for tracks...
    res.json({ message: 'Implement tracks logic here.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch track data.' });
  }
}
