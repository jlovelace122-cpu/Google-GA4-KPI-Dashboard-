import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const email = env.match(/GA4_CLIENT_EMAIL=([^\n]+)/)?.[1]?.trim();
const rawKey = env.match(/GA4_PRIVATE_KEY="([^"]+)"/s)?.[1];
const key = rawKey?.replace(/\\n/g, '\n').trim();

if (!email || !key) { console.log('Could not parse credentials from .env.local'); process.exit(1); }

const auth = new GoogleAuth({
  credentials: { type: 'service_account', client_email: email, private_key: key },
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});
const client = await auth.getClient();
const token = (await client.getAccessToken()).token;

const res = await fetch('https://analyticsdata.googleapis.com/v1beta/properties/496741172:runReport', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'hostname' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 50,
  }),
});

const data = await res.json();
if (data.error) { console.log('GA4 ERROR:', JSON.stringify(data.error, null, 2)); process.exit(1); }

console.log('\nActive dealership hostnames in GA4 property 496741172 (last 30 days):\n');
const rows = data.rows || [];
rows.forEach(r => {
  const host = r.dimensionValues[0].value.padEnd(55);
  const sess = r.metricValues[0].value.padStart(8);
  const users = r.metricValues[1].value.padStart(8);
  console.log(`  ${host}  sessions:${sess}  users:${users}`);
});
console.log(`\nTotal active hostnames: ${data.rowCount ?? rows.length}`);
console.log('\n--- NEXT_PUBLIC_DEALER_HOSTNAMES value (copy into .env.local) ---');
console.log(rows.map(r => r.dimensionValues[0].value).filter(h => h !== '(not set)').join(','));
