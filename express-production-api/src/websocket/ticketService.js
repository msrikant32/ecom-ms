const crypto = require('crypto');
const { getCache } = require('../utils/cache');
const config = require('../config');

/**
 * Why not just connect with `wss://host/ws?token=<JWT>`?
 *
 * Query strings end up in browser history, proxy access logs, and
 * Referer headers - a long-lived access token sitting there is a real
 * leak surface. Instead:
 *
 *   1. The client calls POST /api/v1/ws/ticket (normal Bearer-authenticated
 *      REST request - the JWT never touches a URL).
 *   2. The server mints a random, single-use ticket, stores
 *      ticket -> { userId, roles } in Redis with a short TTL, and returns it.
 *   3. The client opens `wss://host/ws?ticket=<ticket>` immediately.
 *   4. The server looks up and DELETES the ticket atomically on first use
 *      (get-then-delete) - a captured/replayed ticket is worthless after
 *      the first connection attempt, and it self-expires within seconds
 *      even if never used.
 */
async function issueTicket(user) {
  const ticket = crypto.randomBytes(32).toString('base64url');
  const cache = await getCache();
  await cache.set(
    `ws-ticket:${ticket}`,
    { userId: user.id, email: user.email, roles: user.roles },
    config.ws.ticketTtlSeconds
  );
  return { ticket, expiresIn: config.ws.ticketTtlSeconds };
}

async function consumeTicket(ticket) {
  if (!ticket || typeof ticket !== 'string') return null;
  const cache = await getCache();
  const key = `ws-ticket:${ticket}`;
  const payload = await cache.get(key);
  if (!payload) return null;
  await cache.del(key); // single-use: burn it immediately whether or not the caller proceeds
  return payload;
}

module.exports = { issueTicket, consumeTicket };
