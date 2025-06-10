import { getPlaylistTracks, getArtistsDetails } from '../../spotify.js';
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

    // --- Analyze Top Genres (by number of songs, one genre per track, first artist only) ---
    const artistIds = [...new Set(tracks.flatMap(track => track.artists.map(artist => artist.id)))];
    const artistsDetails = await getArtistsDetails(artistIds, accessToken);
    const genreCounts = {};
    tracks.forEach(track => {
      let foundGenre = null;
      if (track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
        const artist = track.artists[0];
        if (artist && artist.id) {
          const artistDetail = artistsDetails.find(a => a.id === artist.id);
          if (artistDetail && Array.isArray(artistDetail.genres) && artistDetail.genres.length > 0) {
            foundGenre = artistDetail.genres[0]; // Use the first genre of the first artist only
          }
        }
      }
      if (foundGenre) {
        genreCounts[foundGenre] = (genreCounts[foundGenre] || 0) + 1;
      }
    });
    const topGenres = Object.entries(genreCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([genre, count]) => ({ genre, count }));

    // --- Analyze Top Artists ---
    const artistCounts = {};
    tracks.forEach(track => {
      track.artists.forEach(artist => {
        artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;
      });
    });
    const topArtists = Object.entries(artistCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([artist, count]) => ({ artist, count }));

    // --- Analyze Top Contributors ---
    const contributorCounts = {};
    tracks.forEach(track => {
      if (track.added_by && track.added_by.id) {
        const contributorId = track.added_by.id;
        contributorCounts[contributorId] = {
          id: contributorId,
          count: (contributorCounts[contributorId] ? contributorCounts[contributorId].count : 0) + 1
        };
      }
    });
    // Resolve display names for all contributors
    const allContributorsRaw = Object.values(contributorCounts);
    const allContributors = await Promise.all(
      allContributorsRaw.map(async u => {
        try {
          const response = await fetch(
            `https://api.spotify.com/v1/users/${u.id}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!response.ok) throw new Error('Profile not found');
          const profile = await response.json();
          return {
            id: u.id,
            name: profile.display_name || profile.id,
            count: u.count
          };
        } catch {
          return {
            id: u.id,
            name: u.id,
            count: u.count
          };
        }
      })
    );

    res.json({
      allGenres: topGenres,
      allArtists: topArtists,
      allContributors
    });
  } catch (error) {
    if (error.message && error.message.includes('Unauthorized')) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired Spotify access token.' });
    } else if (error.message && error.message.includes('not found')) {
      res.status(404).json({ error: 'Playlist not found or not accessible.' });
    } else {
      res.status(500).json({ error: 'Failed to analyze playlist data.' });
    }
  }
}
