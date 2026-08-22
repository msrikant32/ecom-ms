const { WebSocketServer } = require('ws');
const { URL } = require('url');
const config = require('../config');
const logger = require('../config/logger');
const { consumeTicket } = require('./ticketService');
const eventBus = require('../events/listeners');

/**
 * Security properties this module enforces, and why each matters for a
 * WebSocket specifically (the browser's usual same-origin protections
 * largely don't apply to WS the way they do to fetch/XHR):
 *
 * 1. Origin allowlisting on the upgrade request - WebSocket handshakes are
 *    NOT subject to CORS or the same-origin policy the way fetch() is; a
 *    malicious page can freely open a WebSocket to this server and would
 *    have the victim's cookies attached. This is "Cross-Site WebSocket
 *    Hijacking" (CSWSH). We check the Origin header against the same
 *    allowlist used for CORS before ever completing the handshake.
 *
 * 2. Short-lived, single-use ticket instead of a raw JWT in the query
 *    string - see ticketService.js for the full rationale.
 *
 * 3. Auth happens BEFORE the WebSocket handshake completes (during the raw
 *    HTTP `upgrade` event, using `noServer: true`), so an unauthenticated
 *    or cross-origin caller never gets a socket at all - we reject with a
 *    proper HTTP status and close the TCP connection, rather than
 *    accepting the socket and disconnecting after the fact.
 *
 * 4. Per-connection inbound message rate limiting - independent of the
 *    HTTP rate limiter, since a single persistent connection can otherwise
 *    send unlimited messages.
 *
 * 5. Bounded message size (`maxPayload`) - protocol-level cap enforced by
 *    the `ws` library itself; oversized frames close the connection.
 *
 * 6. Heartbeat (ping/pong) - detects and cleans up half-open connections
 *    (e.g. a client that disappeared without a clean close), which
 *    otherwise accumulate and leak memory/file descriptors.
 *
 * 7. Room-based authorization - a connection can only subscribe to rooms
 *    it's entitled to (its own `user:<id>` room, or `admin:*` rooms if it
 *    holds the admin role), checked server-side on every subscribe
 *    request rather than trusted from the client.
 */

function isOriginAllowed(origin) {
  // Non-browser clients (server-to-server, native apps) send no Origin
  // header at all - that's fine, since Origin spoofing isn't a browser
  // enforcing anything for them anyway; the ticket is still required.
  if (!origin) return true;
  return config.cors.origins.includes(origin);
}

function createWebSocketServer(httpServer) {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: config.ws.maxPayloadBytes,
  });

  httpServer.on('upgrade', async (req, socket, head) => {
    try {
      if (!req.url.startsWith('/ws')) {
        socket.destroy();
        return;
      }

      const origin = req.headers.origin;
      if (!isOriginAllowed(origin)) {
        logger.warn('ws.rejected_origin', { origin });
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
      const ticket = searchParams.get('ticket');
      const identity = await consumeTicket(ticket);
      if (!identity) {
        logger.warn('ws.rejected_ticket', { origin });
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, identity);
      });
    } catch (err) {
      logger.error('ws.upgrade_error', { err: err.message });
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req, identity) => {
    ws.isAlive = true;
    ws.userId = identity.userId;
    ws.roles = identity.roles || [];
    // Every connection auto-joins its own private room; nothing else is
    // granted until explicitly (and validly) subscribed.
    ws.rooms = new Set([`user:${identity.userId}`]);
    ws.messageTimestamps = [];

    logger.info('ws.connected', { userId: ws.userId });
    send(ws, { type: 'connected', userId: ws.userId, rooms: [...ws.rooms] });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      if (!checkRateLimit(ws)) {
        send(ws, { type: 'error', code: 'RATE_LIMITED', message: 'Too many messages, slow down.' });
        return;
      }
      handleMessage(ws, raw);
    });

    ws.on('close', () => {
      logger.info('ws.disconnected', { userId: ws.userId });
    });

    ws.on('error', (err) => {
      logger.warn('ws.connection_error', { userId: ws.userId, err: err.message });
    });
  });

  // --- Heartbeat: detect and drop dead connections -------------------------
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.info('ws.terminating_stale_connection', { userId: ws.userId });
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, config.ws.heartbeatIntervalMs);
  heartbeat.unref();

  wss.on('close', () => clearInterval(heartbeat));

  // --- Wire domain events to push real-time notifications -------------------
  // Reuses the same event bus that powers the async order-processing
  // listeners - the WebSocket layer is just another (decoupled) subscriber.
  eventBus.on('order.created', (order) => {
    broadcastToRoom(wss, `user:${order.userId}`, {
      type: 'order.created',
      data: { id: order.id, status: order.status, totalCents: order.totalCents },
    });
  });

  return wss;
}

function checkRateLimit(ws) {
  const now = Date.now();
  const windowStart = now - config.ws.rateLimitWindowMs;
  ws.messageTimestamps = ws.messageTimestamps.filter((t) => t > windowStart);
  if (ws.messageTimestamps.length >= config.ws.maxMessagesPerWindow) {
    return false;
  }
  ws.messageTimestamps.push(now);
  return true;
}

function handleMessage(ws, raw) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch {
    return send(ws, { type: 'error', code: 'BAD_MESSAGE', message: 'Message must be valid JSON.' });
  }

  if (!message || typeof message.type !== 'string') {
    return send(ws, { type: 'error', code: 'BAD_MESSAGE', message: 'Message must include a string "type".' });
  }

  switch (message.type) {
    case 'subscribe':
      return handleSubscribe(ws, message.room);
    case 'unsubscribe':
      return handleUnsubscribe(ws, message.room);
    case 'ping':
      return send(ws, { type: 'pong' });
    default:
      return send(ws, { type: 'error', code: 'UNKNOWN_TYPE', message: `Unknown message type: ${message.type}` });
  }
}

// Room grants are decided server-side from the authenticated identity, not
// trusted from client input - a user can only ever join their own private
// room; admin-scoped rooms require the admin role.
function isRoomAllowed(ws, room) {
  if (typeof room !== 'string') return false;
  if (room === `user:${ws.userId}`) return true;
  if (room.startsWith('admin:') && ws.roles.includes('admin')) return true;
  return false;
}

function handleSubscribe(ws, room) {
  if (!isRoomAllowed(ws, room)) {
    return send(ws, { type: 'error', code: 'FORBIDDEN_ROOM', message: `Not authorized to join room: ${room}` });
  }
  ws.rooms.add(room);
  send(ws, { type: 'subscribed', room });
}

function handleUnsubscribe(ws, room) {
  ws.rooms.delete(room);
  send(ws, { type: 'unsubscribed', room });
}

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastToRoom(wss, room, payload) {
  wss.clients.forEach((ws) => {
    if (ws.rooms.has(room)) send(ws, payload);
  });
}

module.exports = { createWebSocketServer };
