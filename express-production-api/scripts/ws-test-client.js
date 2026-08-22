// Ad-hoc test client (not part of the shipped app) exercising:
//  - valid ticket -> connect -> subscribe to own room -> receive push
//  - reused ticket -> rejected
//  - bad/missing ticket -> rejected
//  - disallowed Origin -> rejected (CSWSH protection)
//  - subscribing to someone else's room -> forbidden
//  - message flood -> rate limited
const WebSocket = require('ws');

const BASE = 'http://localhost:3000';
const WS_BASE = 'ws://localhost:3000/ws';

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function connect(url, headers = {}) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url, { headers });
    const messageBuffer = [];
    // Buffer every message from the moment the socket opens, so nothing is
    // lost to the gap between "connection established" and "caller attached
    // a listener" - this is a test-script concern only, not a server one.
    ws.on('message', (raw) => messageBuffer.push(JSON.parse(raw.toString())));

    let settled = false;
    ws.on('open', () => {
      settled = true;
      resolve({ ws, ok: true, messageBuffer });
    });
    ws.on('unexpected-response', (req, res) => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, status: res.statusCode });
    });
    ws.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, status: 'error' });
    });
  });
}

function waitForMessage(ws, messageBuffer, predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const existing = messageBuffer.find(predicate);
    if (existing) return resolve(existing);

    const timer = setTimeout(() => reject(new Error('timeout waiting for message')), timeoutMs);
    const handler = (raw) => {
      const msg = JSON.parse(raw.toString());
      if (predicate(msg)) {
        clearTimeout(timer);
        ws.off('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });
}

async function main() {
  console.log('== login ==');
  const login = await jsonFetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@example.com', password: 'AdminPass123!' }),
  });
  const { accessToken, user } = login.body;
  console.log('logged in as', user.email, user.id);

  console.log('\n== issue ticket ==');
  const ticketRes = await jsonFetch(`${BASE}/api/v1/ws/ticket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const { ticket } = ticketRes.body;
  console.log('ticket issued:', ticket.slice(0, 12) + '...');

  console.log('\n== connect with valid ticket + allowed origin ==');
  const { ws, ok, messageBuffer } = await connect(`${WS_BASE}?ticket=${ticket}`, { Origin: 'http://localhost:5173' });
  console.log('connected:', ok);
  const welcome = await waitForMessage(ws, messageBuffer, (m) => m.type === 'connected');
  console.log('server welcome:', welcome);

  console.log('\n== reuse the SAME (now-burned) ticket -> expect rejection ==');
  const reuse = await connect(`${WS_BASE}?ticket=${ticket}`, { Origin: 'http://localhost:5173' });
  console.log('reuse accepted?', reuse.ok, 'status:', reuse.status);

  console.log('\n== connect with garbage ticket -> expect 401 ==');
  const badTicket = await connect(`${WS_BASE}?ticket=not-a-real-ticket`, { Origin: 'http://localhost:5173' });
  console.log('bad ticket accepted?', badTicket.ok, 'status:', badTicket.status);

  console.log('\n== connect with DISALLOWED origin -> expect 403 (CSWSH protection) ==');
  const ticket2 = (await jsonFetch(`${BASE}/api/v1/ws/ticket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })).body.ticket;
  const badOrigin = await connect(`${WS_BASE}?ticket=${ticket2}`, { Origin: 'http://evil.example.com' });
  console.log('evil origin accepted?', badOrigin.ok, 'status:', badOrigin.status);

  console.log('\n== try subscribing to a room I do not own -> expect forbidden ==');
  ws.send(JSON.stringify({ type: 'subscribe', room: 'user:someone-elses-id' }));
  const forbidden = await waitForMessage(ws, messageBuffer, (m) => m.type === 'error');
  console.log('server response:', forbidden);

  console.log('\n== subscribe to my own admin room (I AM admin) -> should succeed ==');
  ws.send(JSON.stringify({ type: 'subscribe', room: 'admin:orders' }));
  const subscribed = await waitForMessage(ws, messageBuffer, (m) => m.type === 'subscribed');
  console.log('server response:', subscribed);

  console.log('\n== trigger order.created event via REST, expect a push over the socket ==');
  const pushPromise = waitForMessage(ws, messageBuffer, (m) => m.type === 'order.created');
  await jsonFetch(`${BASE}/api/v1/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Idempotency-Key': `ws-demo-${Date.now()}` },
    body: JSON.stringify({ items: [{ productId: 'p1', quantity: 1 }] }),
  });
  const push = await pushPromise;
  console.log('received real-time push:', push);

  console.log('\n== flood messages to trigger rate limiting ==');
  let rateLimited = false;
  for (let i = 0; i < 30; i++) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
  await new Promise((resolve) => {
    const handler = (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'error' && msg.code === 'RATE_LIMITED') {
        rateLimited = true;
        ws.off('message', handler);
        resolve();
      }
    };
    ws.on('message', handler);
    setTimeout(resolve, 2000);
  });
  console.log('rate limit triggered:', rateLimited);

  ws.close(1000, 'test complete');
  console.log('\nAll checks complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
