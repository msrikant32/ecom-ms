const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createQueueStore } = require('../src/db/queue');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('queue store', () => {
  let store;

  before(() => {
    // In-memory - isolated from the real data/queue.db the running services use.
    store = createQueueStore(':memory:');
  });

  after(() => {
    store.close();
  });

  test('enqueue then receive delivers the message once, invisible on immediate re-receive', () => {
    store.enqueue('test-queue', { hello: 'world' }, 5);

    const first = store.receive('test-queue', 10, 5000);
    assert.equal(first.length, 1);
    assert.deepEqual(first[0].payload, { hello: 'world' });
    assert.equal(first[0].attempts, 1);

    const second = store.receive('test-queue', 10, 5000);
    assert.equal(second.length, 0, 'in-flight message must not be redelivered before its visibility timeout expires');
  });

  test('ack removes the message permanently', () => {
    store.enqueue('ack-queue', { n: 1 }, 5);
    const [msg] = store.receive('ack-queue', 10, 5000);

    const acked = store.ack('ack-queue', msg.receiptHandle);
    assert.equal(acked, true);

    const again = store.receive('ack-queue', 10, 5000);
    assert.equal(again.length, 0);
  });

  test('ack with a wrong or stale receipt handle does not delete the message', () => {
    store.enqueue('ack-queue-2', { n: 1 }, 5);
    const [msg] = store.receive('ack-queue-2', 10, 5000);

    const badAck = store.ack('ack-queue-2', 'not-the-real-handle');
    assert.equal(badAck, false);

    const goodAck = store.ack('ack-queue-2', msg.receiptHandle);
    assert.equal(goodAck, true, 'the real handle should still work afterward');
  });

  test('queues are independent - enqueueing to one does not affect another', () => {
    store.enqueue('queue-a', { from: 'a' }, 5);
    store.enqueue('queue-b', { from: 'b' }, 5);

    const a = store.receive('queue-a', 10, 5000);
    const b = store.receive('queue-b', 10, 5000);

    assert.equal(a.length, 1);
    assert.equal(b.length, 1);
    assert.equal(a[0].payload.from, 'a');
    assert.equal(b[0].payload.from, 'b');
  });

  test('unacked message redelivers after its visibility timeout with a new receipt handle', async () => {
    store.enqueue('redeliver-queue', { n: 1 }, 5);

    const [first] = store.receive('redeliver-queue', 10, 50); // 50ms visibility timeout
    assert.equal(first.attempts, 1);

    await sleep(80);

    const [second] = store.receive('redeliver-queue', 10, 50);
    assert.ok(second, 'message should be redelivered once the timeout has expired');
    assert.equal(second.attempts, 2, 'attempts must increment on redelivery');
    assert.notEqual(second.receiptHandle, first.receiptHandle, 'each delivery gets a fresh receipt handle');
  });

  test('message dead-letters after max_attempts and stops being delivered', async () => {
    store.enqueue('dlq-queue', { n: 1 }, 2); // max 2 attempts

    let last;
    for (let i = 0; i < 2; i++) {
      const [msg] = store.receive('dlq-queue', 10, 30);
      assert.ok(msg, `expected a delivery on attempt ${i + 1}`);
      last = msg;
      await sleep(50);
    }
    assert.equal(last.attempts, 2);

    // Third receive attempt (after the 2 allowed deliveries) should
    // dead-letter it instead of handing it out again.
    const third = store.receive('dlq-queue', 10, 30);
    assert.equal(third.length, 0);

    const dead = store.listDeadLetters('dlq-queue');
    assert.equal(dead.length, 1);
    assert.equal(dead[0].attempts, 3);
    assert.deepEqual(dead[0].payload, { n: 1 });
  });

  test('stats reflects queue/status counts accurately', () => {
    store.enqueue('stats-queue', { n: 1 }, 5);
    store.enqueue('stats-queue', { n: 2 }, 5);

    const rows = store.stats();
    const visibleRow = rows.find((r) => r.queue === 'stats-queue' && r.status === 'visible');
    assert.ok(visibleRow);
    assert.equal(visibleRow.count, 2);
  });

  test('receive respects maxMessages and only takes what is asked for', () => {
    for (let i = 0; i < 5; i++) store.enqueue('batch-queue', { i }, 5);

    const batch = store.receive('batch-queue', 3, 5000);
    assert.equal(batch.length, 3);

    const remainingStats = store.stats().find((r) => r.queue === 'batch-queue' && r.status === 'visible');
    assert.equal(remainingStats.count, 2, 'the other 2 messages should still be visible, untouched');
  });
});
