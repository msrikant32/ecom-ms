// Live demo of the queue engine's actual behavior, run against the real
// running event-bus (not a mock). Uses throwaway demo-* queue names so it
// never touches the real order/inventory/notification queues or data.
//
// Usage: npm run demo   (event-bus must already be running)
require('dotenv').config();

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;
const SECRET = process.env.INTERNAL_SECRET || 'change_me_internal_secret';

const HAPPY_QUEUE = 'demo-happy-path';
const POISON_QUEUE = 'demo-poison';

function headers() {
  return { 'Content-Type': 'application/json', 'X-Internal-Secret': SECRET };
}

async function sendToQueue(queue, payload, maxAttempts) {
  const res = await fetch(`${BASE_URL}/api/v1/queues/${queue}/messages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ payload, maxAttempts }),
  });
  if (!res.ok) throw new Error(`send failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function receive(queue, { maxMessages = 10, visibilityTimeoutSeconds = 5 } = {}) {
  const res = await fetch(
    `${BASE_URL}/api/v1/queues/${queue}/receive?maxMessages=${maxMessages}&visibilityTimeoutSeconds=${visibilityTimeoutSeconds}`,
    { method: 'POST', headers: headers() }
  );
  if (!res.ok) throw new Error(`receive failed: ${res.status} ${await res.text()}`);
  return (await res.json()).messages;
}

async function ack(queue, receiptHandle) {
  await fetch(`${BASE_URL}/api/v1/queues/${queue}/messages/${receiptHandle}`, {
    method: 'DELETE',
    headers: headers(),
  });
}

async function dlq(queue) {
  const res = await fetch(`${BASE_URL}/api/v1/queues/${queue}/dlq`, { headers: headers() });
  return (await res.json()).messages;
}

async function statsFor(queue) {
  const res = await fetch(`${BASE_URL}/api/v1/stats`, { headers: headers() });
  const all = (await res.json()).stats;
  return all.filter((r) => r.queue === queue);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp() {
  return new Date().toISOString().slice(11, 19);
}

function printStats(label, rows) {
  const summary = rows.length ? rows.map((r) => `${r.status}=${r.count}`).join(', ') : 'empty (acked/never sent)';
  console.log(`  [${timestamp()}] ${label}: ${summary}`);
}

async function happyPath() {
  console.log('--- Happy path: send -> receive (goes in_flight, invisible) -> ack (disappears) ---');

  await sendToQueue(HAPPY_QUEUE, { note: 'a normal message' });
  printStats('after send', await statsFor(HAPPY_QUEUE));

  const [msg] = await receive(HAPPY_QUEUE, { visibilityTimeoutSeconds: 10 });
  console.log(`  received messageId=${msg.messageId.slice(0, 8)}... attempts=${msg.attempts}`);
  printStats('after receive (now in_flight, hidden from other consumers)', await statsFor(HAPPY_QUEUE));

  await sleep(500);
  await ack(HAPPY_QUEUE, msg.receiptHandle);
  printStats('after ack', await statsFor(HAPPY_QUEUE));
}

async function poisonMessage() {
  console.log('\n--- Poison message: never acked, 3s visibility timeout, max 3 attempts before dead-lettering ---');

  await sendToQueue(POISON_QUEUE, { note: 'this consumer keeps "crashing" and never acks it' }, 3);

  for (let attempt = 1; attempt <= 4; attempt++) {
    const [msg] = await receive(POISON_QUEUE, { visibilityTimeoutSeconds: 3, maxMessages: 1 });
    if (msg) {
      console.log(
        `  attempt ${attempt}: delivered (attempts=${msg.attempts}, receiptHandle=${msg.receiptHandle.slice(0, 8)}...) - deliberately NOT acking`
      );
    } else {
      console.log(`  attempt ${attempt}: nothing delivered - it was dead-lettered on this attempt`);
    }
    printStats(`stats after attempt ${attempt}`, await statsFor(POISON_QUEUE));

    if (attempt < 4) {
      console.log('  waiting for the visibility timeout to expire before trying again...');
      await sleep(3200);
    }
  }

  const dead = await dlq(POISON_QUEUE);
  console.log(`\n  dead-letter queue for ${POISON_QUEUE}:`);
  console.log(`  ${JSON.stringify(dead, null, 2).split('\n').join('\n  ')}`);
}

async function main() {
  console.log('=== event-bus live demo ===');
  console.log(`Talking to ${BASE_URL}. Uses throwaway demo-* queues - does not touch real order/inventory/notification data.\n`);

  await happyPath();
  await poisonMessage();

  console.log('\n=== done ===');
}

main().catch((err) => {
  console.error('demo failed:', err.message);
  process.exit(1);
});
