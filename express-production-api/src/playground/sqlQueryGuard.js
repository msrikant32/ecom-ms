// Defense-in-depth ON TOP of the read-only DB connection (playground/sqlDb.js),
// not instead of it - the read-only connection is the real guarantee (SQLite
// itself refuses any write), this just rejects obviously-wrong input early
// with a clearer error message than a raw SQLite error would give.
const FORBIDDEN_KEYWORDS =
  /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum|replace|reindex|begin|commit)\b/i;

function assertSafeSelectQuery(sql) {
  if (typeof sql !== 'string') {
    throw new Error('sql must be a string');
  }
  const trimmed = sql.trim().replace(/;+\s*$/, ''); // allow one optional trailing semicolon
  if (!trimmed) {
    throw new Error('Query cannot be empty');
  }
  if (trimmed.includes(';')) {
    throw new Error('Only a single statement is allowed - no stacked queries');
  }
  if (!/^select\b/i.test(trimmed)) {
    throw new Error('Only SELECT queries are allowed in this playground');
  }
  if (FORBIDDEN_KEYWORDS.test(trimmed)) {
    throw new Error('Query contains a keyword not allowed in this read-only playground');
  }
  return trimmed;
}

module.exports = { assertSafeSelectQuery };
