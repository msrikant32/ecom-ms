"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { uploadSync, type AuthUser, type SyncUploadResult } from "@/lib/upload/api";
import { formatBytes } from "@/lib/upload/formatBytes";
import { PingStrip } from "./PingStrip";
import { usePingMonitor } from "./usePingMonitor";

const MAX_SYNC_BYTES = 100 * 1024 * 1024;

type Phase = "idle" | "uploading" | "done" | "error";

export function SyncUploadPanel({
  accessToken,
  user,
  onLogout,
}: {
  accessToken: string;
  user: AuthUser;
  onLogout: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SyncUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isUploading = phase === "uploading";
  const pingSamples = usePingMonitor(isUploading);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setPhase("idle");
    setResult(null);
    setErrorMessage(null);
  }

  async function startUpload() {
    if (!file) return;
    setErrorMessage(null);
    setResult(null);
    setPhase("uploading");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await uploadSync(accessToken, file, controller.signal);
      setResult(res);
      setPhase("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Sync upload failed");
      setPhase("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800">
        <span className="text-zinc-600 dark:text-zinc-400">
          Signed in as{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</span>
        </span>
        <button onClick={onLogout} className="text-sky-600 hover:underline dark:text-sky-400">
          Sign out
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This is the naive way to handle an upload: the whole file arrives as one request,
          gets fully buffered in memory, then written with a single blocking{" "}
          <code className="font-mono">fs.writeFileSync()</code> call. Capped at{" "}
          {formatBytes(MAX_SYNC_BYTES)} on purpose — large enough to make the freeze visible,
          small enough that it can&apos;t actually wedge the server for long. Pick a file close
          to that size for the clearest effect.
        </p>

        <input
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          className="text-sm"
        />
        {file && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {file.name} — {formatBytes(file.size)}
            {file.size > MAX_SYNC_BYTES && (
              <span className="text-red-500"> — exceeds the {formatBytes(MAX_SYNC_BYTES)} cap</span>
            )}
          </p>
        )}

        <button
          onClick={startUpload}
          disabled={!file || isUploading || file.size > MAX_SYNC_BYTES}
          className="self-start rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {isUploading ? "Uploading — server is blocked…" : "Start sync upload"}
        </button>

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

        <PingStrip samples={pingSamples} label="Server responsiveness — ping every ~60ms" />

        {result && (
          <div className="flex flex-col gap-1 rounded-md bg-red-500/10 px-3 py-3 text-sm text-red-700 dark:text-red-300">
            <p className="font-semibold">
              The server&apos;s event loop was completely frozen for {Math.round(result.blockedForMs)}
              ms during fs.writeFileSync — find that gap in the ping strip above.
            </p>
            <p>
              {result.fileName} — {formatBytes(result.size)} — deleted immediately after, same
              policy as the async demo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
