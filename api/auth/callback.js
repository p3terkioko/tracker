import { exchangeCodeForTokens } from '../../spotify.js';
import querystring from 'querystring';

export default async function handler(req, res) {
  const { code, state } = req.query;
  if (!state) {
    res.writeHead(302, {
      Location: '/#' + querystring.stringify({ error: 'state_mismatch' })
    });
    res.end();
    return;
  }
  try {
    const tokenData = await exchangeCodeForTokens(code);
    const { access_token, refresh_token, expires_in } = tokenData;
    res.writeHead(302, {
      Location: '/#' + querystring.stringify({
        access_token,
        refresh_token,
        expires_in
      })
    });
    res.end();
  } catch (error) {
    res.writeHead(302, {
      Location: '/#' + querystring.stringify({
        error: 'token_exchange_failed',
        message: error.message
      })
    });
    res.end();
  }
}
