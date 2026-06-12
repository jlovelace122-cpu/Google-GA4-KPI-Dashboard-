import { readFileSync } from 'fs';
import { createServer } from 'http';
import { URL } from 'url';

const envContent = readFileSync('.env.local', 'utf8');
const vars = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) {
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    vars[m[1]] = val;
  }
}

const CLIENT_ID     = vars['GOOGLE_CLIENT_ID'];
const CLIENT_SECRET = vars['GOOGLE_CLIENT_SECRET'];
const SERVICE_EMAIL = vars['GA4_CLIENT_EMAIL'];
const PROPERTY_ID   = vars['GA4_PROPERTY_ID'];
const REDIRECT_URI  = 'http://localhost:9876/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/analytics.manage.users');
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('\nOpen this URL in your browser and sign in with your GA4 admin Google account:\n');
console.log(authUrl.toString());
console.log('\nWaiting for redirect on http://localhost:9876 ...\n');

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const parsed = new URL(req.url, 'http://localhost:9876');
    const authCode = parsed.searchParams.get('code');
    const error = parsed.searchParams.get('error');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if (authCode) {
      res.end('<h2 style="font-family:sans-serif;padding:40px">Authorized! Close this tab and check the terminal.</h2>');
      server.close();
      resolve(authCode);
    } else {
      res.end('<h2 style="font-family:sans-serif;padding:40px">Error: ' + error + '</h2>');
      server.close();
      reject(new Error(error));
    }
  });
  server.listen(9876);
});

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  }),
});
const tokenData = await tokenRes.json();
if (!tokenData.access_token) {
  console.error('Failed to get token:', JSON.stringify(tokenData, null, 2));
  process.exit(1);
}
console.log('Got access token - granting access...\n');

const apiUrl = 'https://analyticsadmin.googleapis.com/v1alpha/' + PROPERTY_ID + '/accessBindings';
const apiRes = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + tokenData.access_token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user: SERVICE_EMAIL,
    roles: ['predefinedRoles/viewer'],
  }),
});

const result = await apiRes.json();
if (apiRes.ok) {
  console.log('Access granted successfully!');
  console.log(SERVICE_EMAIL + ' is now a Viewer on ' + PROPERTY_ID);
} else {
  console.error('Failed:', apiRes.status, JSON.stringify(result, null, 2));
}
