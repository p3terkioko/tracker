// tracker/server.js
// Main Express server setup.
// Updated to support Spotify Authorization Code Flow.

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import querystring from 'querystring'; // Added querystring import
import {
    requestUserAuthorization,
    exchangeCodeForTokens,
    refreshUserAccessToken,
    getUsersPlaylists // Import the new function
} from './spotify.js';

// Import route handlers
import analyzeRoutes from './routes/analyze.js';
import contributorsRoutes from './routes/contributors.js';
import tracksRoutes from './routes/tracks.js';

dotenv.config(); // Load environment variables from .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8888;
const REDIRECT_URI = process.env.REDIRECT_URI; // Make sure this matches your ngrok URL

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Spotify OAuth login - Initiates Authorization Code Flow
app.get('/auth/login', (req, res) => {
    const authorizeUrl = requestUserAuthorization();
    res.redirect(authorizeUrl);
});

// Spotify OAuth callback - Handles the redirect from Spotify
app.get('/auth/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        // Handle error: state mismatch, or no state provided
        console.error('State mismatch or missing in OAuth callback.');
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        try {
            const tokenData = await exchangeCodeForTokens(code);
            const { access_token, refresh_token, expires_in } = tokenData;

            // Redirect back to frontend, passing tokens as URL parameters or in hash
            // For simplicity, we'll pass them in the hash.
            res.redirect('/#' +
                querystring.stringify({
                    access_token: access_token,
                    refresh_token: refresh_token,
                    expires_in: expires_in
                }));
        } catch (error) {
            console.error('Error during Spotify OAuth callback:', error);
            res.redirect('/#' +
                querystring.stringify({
                    error: 'token_exchange_failed',
                    message: error.message
                }));
        }
    }
});

// Endpoint to refresh user's access token
app.get('/auth/refresh_token', async (req, res) => {
    const refreshToken = req.query.refresh_token;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token missing.' });
    }

    try {
        const tokenData = await refreshUserAccessToken(refreshToken);
        const { access_token, expires_in } = tokenData;
        // Optionally, a new refresh token can also be returned by Spotify,
        // but it's not guaranteed. Use the old one if new isn't provided.
        const newRefreshToken = tokenData.refresh_token || refreshToken;

        res.json({
            access_token: access_token,
            refresh_token: newRefreshToken,
            expires_in: expires_in
        });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Failed to refresh token.' });
    }
});

// New endpoint to fetch user's playlists
app.get('/me/playlists', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized: Access token missing.' });
    }

    try {
        const playlists = await getUsersPlaylists(accessToken);
        res.json(playlists);
    } catch (error) {
        console.error('Error fetching user playlists:', error);
        if (error.message.includes('Unauthorized')) {
            res.status(401).json({ error: 'Unauthorized: Invalid or expired Spotify access token.' });
        } else {
            res.status(500).json({ error: 'Failed to fetch user playlists.' });
        }
    }
});

// API Routes - now include playlistId as a parameter and require Authorization header
app.use('/playlist', analyzeRoutes); // /playlist/analyze/:playlistId
app.use('/playlist', contributorsRoutes); // /playlist/contributors/:playlistId
app.use('/playlist', tracksRoutes); // /playlist/tracks/:playlistId

// Root route to serve the index.html (SPA)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`KamiLimu.inthe.Ears backend listening on port ${PORT}`);
    console.log(`OAuth Redirect URI: ${REDIRECT_URI}`);
    console.log(`Open http://localhost:${PORT} in your browser to start.`);
});
