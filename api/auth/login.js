import { requestUserAuthorization } from '../../spotify.js';

export default function handler(req, res) {
  // Initiate Spotify OAuth login
  const authorizeUrl = requestUserAuthorization();
  res.writeHead(302, { Location: authorizeUrl });
  res.end();
}
