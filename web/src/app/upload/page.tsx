"use client";

import { useState } from "react";
import { LoginPanel } from "@/components/upload/LoginPanel";
import { UploadPanel } from "@/components/upload/UploadPanel";
import { SyncUploadPanel } from "@/components/upload/SyncUploadPanel";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import type { AuthUser } from "@/lib/upload/api";

type Mode = "async" | "sync";

export default function UploadPage() {
  const [session, setSession] = useState<{ accessToken: string; user: AuthUser } | null>(
    null
  );
  const [mode, setMode] = useState<Mode>("async");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Large File Upload" }]} />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
          Practical Implementation
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Large File Upload — Async vs. Sync
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Two real, working implementations against the express-production-api backend, side by
          side, so you can see the difference instead of just reading about it. While either one
          uploads, this page also polls a trivial <code className="font-mono">/ping</code>{" "}
          endpoint on that same server every ~60ms and plots the round-trip time. That strip is a
          live readout of one thing: is the server&apos;s single JavaScript thread actually free
          to do anything else right now?
        </p>
      </header>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("async")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "async"
              ? "bg-sky-600 text-white"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Async (chunked, streamed)
        </button>
        <button
          onClick={() => setMode("sync")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "sync"
              ? "bg-red-600 text-white"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Sync (blocking, whole-file)
        </button>
      </div>

      {session ? (
        mode === "async" ? (
          <UploadPanel
            accessToken={session.accessToken}
            user={session.user}
            onLogout={() => setSession(null)}
          />
        ) : (
          <SyncUploadPanel
            accessToken={session.accessToken}
            user={session.user}
            onLogout={() => setSession(null)}
          />
        )
      ) : (
        <LoginPanel
          onLoggedIn={(accessToken, user) => setSession({ accessToken, user })}
        />
      )}

      <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        {mode === "async" ? (
          <>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Async: what&apos;s actually happening
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <code className="font-mono">POST /uploads</code> opens a session and returns an{" "}
                <code className="font-mono">uploadId</code> plus how many chunks to expect.
              </li>
              <li>
                Each <code className="font-mono">PUT /uploads/:id/chunks/:index</code> sends one
                chunk as a raw <code className="font-mono">application/octet-stream</code> body —
                the server pipes the request stream directly to a file on disk, so at no point
                does the full chunk (let alone the full file) sit in server memory.
              </li>
              <li>
                Because the server is never blocked, it stays free to answer other requests (like
                the ping polls) the whole time — that&apos;s what the flat, low ping strip above
                is showing you.
              </li>
              <li>
                <code className="font-mono">GET /uploads/:id</code> reports which chunk indices
                the server already has — the client uses this to skip re-sending anything on
                resume, whether that&apos;s after clicking Pause or reopening this page for the
                same file.
              </li>
              <li>
                <code className="font-mono">POST /uploads/:id/complete</code>{" "}
                stream-concatenates the chunks, in order, into the final file — again one
                chunk&apos;s worth of data in flight at a time — then deletes that file from disk
                immediately. Nothing uploaded through this demo is retained.
              </li>
            </ul>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Sync: what&apos;s actually happening
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <code className="font-mono">POST /uploads/sync</code> receives the entire file as
                one request body — no chunking at all.
              </li>
              <li>
                The server manually buffers every incoming byte, then calls{" "}
                <code className="font-mono">Buffer.concat()</code> — a synchronous copy of the
                whole file in memory, before anything even reaches disk.
              </li>
              <li>
                <code className="font-mono">fs.writeFileSync()</code> then writes that buffer to
                disk. This is a <em>blocking</em> call — Node.js has exactly one thread for
                running your JavaScript, and while this call is in progress that thread cannot do
                anything else: no other HTTP request, no timer, no WebSocket message, for{" "}
                <em>every</em> client connected to this server, not just you.
              </li>
              <li>
                The response includes <code className="font-mono">blockedForMs</code> — the exact
                duration of just that <code className="font-mono">fs.writeFileSync()</code> call,
                measured on the server with <code className="font-mono">Date.now()</code>. Compare
                it against the gap in the ping strip above: that gap is the server refusing to
                talk to anyone, including itself.
              </li>
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
