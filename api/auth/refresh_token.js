import { refreshUserAccessToken } from '../../spotify.js';

export default async function handler(req, res) {
  const { refresh_token } = req.query;
  if (!refresh_token) {
    res.status(400).json({ error: 'Refresh token missing.' });
    return;
  }
  try {
    const tokenData = await refreshUserAccessToken(refresh_token);
    const { access_token, expires_in } = tokenData;
    const newRefreshToken = tokenData.refresh_token || refresh_token;
    res.json({ access_token, refresh_token: newRefreshToken, expires_in });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh token.' });
  }
}
