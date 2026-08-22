# syntax=docker/dockerfile:1

# bcrypt is a native module (node-gyp) - if no prebuilt binary matches this
# exact platform/arch, `npm install` needs a real C++ toolchain to compile it
# from source. Installing python3/make/g++ ONLY in this stage, not the final
# image, keeps that build tooling out of what actually ships and runs.
FROM node:22-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
# No package-lock.json is committed yet, so `npm ci` (which requires one)
# isn't available - plain install until a lockfile exists.
RUN npm install --omit=dev

# A clean node:22-slim with NO build toolchain - smaller image, smaller
# attack surface. bcrypt's compiled native binding is binary-compatible here
# because both stages share the same base image (same glibc/architecture) -
# it only needs to be copied, not rebuilt.
FROM node:22-slim
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R app:app /app
USER app

ENV NODE_ENV=production
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
