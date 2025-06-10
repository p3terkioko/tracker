// tracker/spotify.js
// This module handles Spotify API authentication (Authorization Code Flow) and requests.

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import querystring from 'querystring';

dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

/**
 * Builds the Spotify authorization URL for the Authorization Code Flow.
 * @returns {string} The URL to redirect the user to.
 */
function requestUserAuthorization() {
    // Define the scopes needed for reading user playlists
    const scopes = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';
    const authorizeUrl = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: scopes,
            redirect_uri: REDIRECT_URI,
            state: 'your_random_state_string_here' // Good practice to include a state parameter for security
        });
    return authorizeUrl;
}

/**
 * Exchanges an authorization code for Spotify Access and Refresh Tokens.
 * @param {string} code - The authorization code received from Spotify.
 * @returns {Promise<object>} An object containing access_token, refresh_token, and expires_in.
 */
async function exchangeCodeForTokens(code) {
    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to exchange code for tokens: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error exchanging code for tokens:', error.message);
        throw error;
    }
}

/**
 * Refreshes an expired Spotify Access Token using the Refresh Token.
 * @param {string} refreshToken - The refresh token.
 * @returns {Promise<object>} An object containing the new access_token and expires_in (and possibly a new refresh_token).
 */
async function refreshUserAccessToken(refreshToken) {
    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to refresh token: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error refreshing token:', error.message);
        throw error;
    }
}

/**
 * Makes an authenticated request to the Spotify Web API using a user's access token.
 * @param {string} url The URL to request.
 * @param {string} accessToken The user's Spotify access token.
 * @returns {Promise<object>} The JSON response from the Spotify API.
 */
async function spotifyApiRequest(url, accessToken) {
    if (!accessToken) {
        throw new Error('Access token is required for Spotify API requests.');
    }
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Spotify API typically returns 401 for expired/invalid tokens
        if (response.status === 401) {
            console.warn('Spotify API request returned 401 (Unauthorized). Token might be expired.');
            throw new Error('Unauthorized: Access token expired or invalid.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Spotify API request failed for ${url}: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error making Spotify API request to ${url}:`, error.message);
        throw error;
    }
}

/**
 * Fetches all tracks from a specific Spotify playlist, handling pagination.
 * Requires a user's access token to access private/collaborative playlists.
 * @param {string} playlistId The ID of the Spotify playlist.
 * @param {string} accessToken The user's Spotify access token.
 * @returns {Promise<Array<object>>} An array of track objects.
 */
async function getPlaylistTracks(playlistId, accessToken) {
    let allTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(id,name,artists(id,name),album(name,release_date),external_urls.spotify),added_by(id,display_name)),next`;

    while (nextUrl) {
        console.log(`Fetching tracks from: ${nextUrl}`);
        const data = await spotifyApiRequest(nextUrl, accessToken);
        // Filter out null tracks (e.g., local files in playlist)
        const validTracks = data.items.filter(item => item.track).map(item => ({
            ...item.track,
            added_by: item.added_by // Attach added_by information to the track
        }));
        allTracks = allTracks.concat(validTracks);
        nextUrl = data.next; // URL for the next page of results, or null if no more pages
    }
    return allTracks;
}

/**
 * Fetches details for a batch of artists.
 * Requires a user's access token.
 * @param {Array<string>} artistIds An array of Spotify artist IDs.
 * @param {string} accessToken The user's Spotify access token.
 * @returns {Promise<Array<object>>} An array of artist objects with genres.
 */
async function getArtistsDetails(artistIds, accessToken) {
    if (artistIds.length === 0) return [];

    const batchSize = 50;
    const allArtists = [];

    for (let i = 0; i < artistIds.length; i += batchSize) {
        const batch = artistIds.slice(i, i + batchSize);
        const idsString = batch.join(',');
        const url = `https://api.spotify.com/v1/artists?ids=${idsString}`;
        console.log(`Fetching artist details for: ${idsString.substring(0, 50)}...`);
        const data = await spotifyApiRequest(url, accessToken);
        if (data && data.artists) {
            allArtists.push(...data.artists);
        }
    }
    return allArtists;
}

/**
 * Fetches public and private playlists for the current user.
 * @param {string} accessToken The user's Spotify access token.
 * @returns {Promise<Array<object>>} An array of playlist objects.
 */
async function getUsersPlaylists(accessToken) {
    let allPlaylists = [];
    let nextUrl = `https://api.spotify.com/v1/me/playlists?limit=50`; // Fetch first 50

    while (nextUrl) {
        console.log(`Fetching user's playlists from: ${nextUrl}`);
        const data = await spotifyApiRequest(nextUrl, accessToken);
        if (data && data.items) {
            allPlaylists = allPlaylists.concat(data.items);
            nextUrl = data.next;
        } else {
            nextUrl = null;
        }
    }
    return allPlaylists;
}


export {
    requestUserAuthorization,
    exchangeCodeForTokens,
    refreshUserAccessToken,
    spotifyApiRequest,
    getPlaylistTracks,
    getArtistsDetails,
    getUsersPlaylists
};
