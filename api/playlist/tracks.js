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
    const trackDetails = tracks.map(track => ({
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album ? track.album.name : 'Unknown Album',
      release_date: track.album ? track.album.release_date : 'Unknown Date',
      spotify_url: track.external_urls ? track.external_urls.spotify : '#',
    }));
    res.json(trackDetails);
  } catch (error) {
    if (error.message && error.message.includes('Unauthorized')) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired Spotify access token.' });
    } else if (error.message && error.message.includes('not found')) {
      res.status(404).json({ error: 'Playlist not found or not accessible.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch track data.' });
    }
  }
}
