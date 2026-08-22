async function paginateOffset(Model, filter, { page = 1, limit = 20 } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  const [items, totalItems] = await Promise.all([
    Model.find(filter).sort({ _id: -1 }).skip(skip).limit(l).lean(),
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

module.exports = { paginateOffset };
