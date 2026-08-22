# syntax=docker/dockerfile:1

# ---- deps stage ------------------------------------------------------------
# bcrypt is a native module (node-gyp) - if no prebuilt binary matches this
# exact platform/arch, `npm ci` needs a real C++ toolchain to compile it from
# source (this repo hit exactly this failure mode earlier with a different
# native module - better-sqlite3 - on a host missing Python/build tools).
# Installing python3/make/g++ ONLY in this stage, not the final image, keeps
# ~200MB of build tooling out of what actually ships and runs in production.
FROM node:22-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Dependencies rarely change; source changes on nearly every commit - copying
# only the manifest first means this (expensive) layer stays cached across
# most rebuilds instead of reinstalling on every single source edit. See the
# Dockerfile layer-cache simulator at /docker for exactly this contrast, live.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runtime stage -----------------------------------------------------
# A clean node:22-slim with NO build toolchain installed - smaller image,
# smaller attack surface than the deps stage. bcrypt's compiled native
# binding is binary-compatible here because both stages share the same
# base image (same glibc/architecture) - the .node binary doesn't need to
# be rebuilt, only copied.
FROM node:22-slim
WORKDIR /app

# Never run the main process as root inside the container.
RUN groupadd --system app && useradd --system --gid app --home-dir /app app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# uploads/ and data/ (the SQLite playground db) are created at runtime by
# the app itself (uploadService.js / playground/sqlDb.js) - this just makes
# sure the non-root user can actually write to WORKDIR to create them.
RUN chown -R app:app /app
USER app

ENV NODE_ENV=production
EXPOSE 3000

# No curl/wget in a slim image - Node itself is already there, so use it
# instead of installing anything extra just for the healthcheck.
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
