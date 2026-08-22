// Every request goes through the gateway, never a microservice directly -
// same rule client-side and server-side. Browser-facing: NEXT_PUBLIC_* vars
// are inlined into the client bundle at build time, so this is fixed once
// the image is built.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

// Server-only equivalent for code that runs exclusively in Server
// Components/route handlers and is never bundled to the client (api.ts).
// Deliberately NOT prefixed NEXT_PUBLIC_ - Next.js only inlines that prefix,
// so this is read fresh from process.env at request time in the container.
// In Docker Compose the browser reaches the gateway via its published
// localhost port (API_BASE_URL) while server-side fetches inside the
// ecom-web container reach it via the Docker network hostname
// (API_INTERNAL_URL=http://gateway:3000) - the two can't be the same value.
export const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? API_BASE_URL;
