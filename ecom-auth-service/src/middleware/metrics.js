const { httpRequestDuration, httpRequestsTotal, httpErrorsTotal } = require('../config/metrics');

// Collapses id-shaped path segments (Mongo ObjectIds, UUIDs, plain numbers)
// to ":id" so /products/<id-a> and /products/<id-b> aggregate under one
// Prometheus label instead of exploding into one time series per id.
const ID_SEGMENT_RE = /^[0-9a-f]{24}$|^[0-9a-f-]{36}$|^\d+$/i;

function normalizeRoute(path) {
  const normalized = path
    .split('/')
    .map((segment) => (segment && ID_SEGMENT_RE.test(segment) ? ':id' : segment))
    .join('/');
  return normalized || '/';
}

function metrics(req, res, next) {
  const start = process.hrtime.bigint();
  // Captured now, not inside the finish handler: for a route nested under
  // app.use(prefix, router) that terminates the response directly (never
  // calls next()), Express never restores req.url's mount-prefix-stripped
  // state - reading req.path lazily at finish time would silently drop the
  // prefix for every successful response while error responses (which do
  // propagate via next(err)) kept it, splitting one endpoint into two labels.
  const route = normalizeRoute(req.path);
  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
    if (res.statusCode >= 400) httpErrorsTotal.inc(labels);
  });
  next();
}

module.exports = { metrics };
