// $where/$function/$accumulator can execute arbitrary JS inside MongoDB
// itself; $expr can nest them. Recursively scanned (not just checked at the
// top level) since a client could bury one of these inside a nested $and/$or.
const FORBIDDEN_OPERATORS = new Set(['$where', '$function', '$accumulator', '$expr']);
const MAX_DEPTH = 6;

function assertSafeFilter(value, depth = 0) {
  if (depth > MAX_DEPTH) {
    throw new Error('Filter is nested too deeply');
  }
  if (Array.isArray(value)) {
    for (const item of value) assertSafeFilter(item, depth + 1);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_OPERATORS.has(key)) {
        throw new Error(`Operator ${key} is not allowed in this read-only playground`);
      }
      assertSafeFilter(nested, depth + 1);
    }
  }
}

const ALLOWED_SORT_DIRECTIONS = new Set([1, -1]);

function assertSafeSort(sort) {
  if (sort == null) return;
  if (typeof sort !== 'object' || Array.isArray(sort)) {
    throw new Error('sort must be a JSON object of field -> 1 or -1');
  }
  for (const direction of Object.values(sort)) {
    if (!ALLOWED_SORT_DIRECTIONS.has(direction)) {
      throw new Error('sort values must be 1 or -1');
    }
  }
}

module.exports = { assertSafeFilter, assertSafeSort };
