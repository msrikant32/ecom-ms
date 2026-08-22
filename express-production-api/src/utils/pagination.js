/**
 * Offset pagination against a Mongoose model - simple, supports "jump to
 * page N", but can skip/repeat items if the underlying collection changes
 * between requests.
 */
async function paginateOffset(Model, filter, { page = 1, limit = 20 } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20)); // cap page size
  const skip = (p - 1) * l;

  const [items, totalItems] = await Promise.all([
    Model.find(filter).sort({ _id: 1 }).skip(skip).limit(l).lean(),
    Model.countDocuments(filter),
  ]);

  return {
    data: items,
    pagination: {
      page: p,
      limit: l,
      totalItems,
      totalPages: Math.ceil(totalItems / l) || 1,
      hasNextPage: skip + l < totalItems,
      hasPrevPage: p > 1,
    },
  };
}

/**
 * Cursor pagination against a Mongoose model - stable under inserts/deletes,
 * scales better than offset for large or frequently-changing datasets.
 * The cursor is a base64-encoded document _id; since MongoDB ObjectIds are
 * monotonically increasing, sorting by _id ascending is enough to make this
 * a correct, stable cursor - no separate "createdAt" field needed.
 */
function encodeCursor(id) {
  return Buffer.from(String(id)).toString('base64url');
}

function decodeCursor(cursor) {
  try {
    return Buffer.from(cursor, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

async function paginateCursor(Model, filter, { cursor, limit = 20 } = {}) {
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const query = { ...filter };

  if (cursor) {
    const decodedId = decodeCursor(cursor);
    if (decodedId) query._id = { $gt: decodedId };
  }

  // Fetch one extra item to know whether another page exists, without a
  // separate count query.
  const items = await Model.find(query).sort({ _id: 1 }).limit(l + 1).lean();
  const hasNextPage = items.length > l;
  const page = hasNextPage ? items.slice(0, l) : items;
  const nextCursor = hasNextPage ? encodeCursor(page[page.length - 1]._id) : null;

  return {
    data: page,
    pagination: { limit: l, nextCursor, hasNextPage },
  };
}

module.exports = { paginateOffset, paginateCursor, encodeCursor, decodeCursor };
