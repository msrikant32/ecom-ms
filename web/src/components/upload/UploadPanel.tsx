"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  abortUpload,
  completeUpload,
  getUploadStatus,
  initUpload,
  uploadChunk,
  type AuthUser,
  type CompleteUploadResult,
} from "@/lib/upload/api";
import { clearResumeRecord, loadResumeRecord, saveResumeRecord } from "@/lib/upload/resumeStore";
import { formatBytes } from "@/lib/upload/formatBytes";
import { PingStrip } from "./PingStrip";
import { usePingMonitor } from "./usePingMonitor";

const CHUNK_SIZE_OPTIONS_MB = [1, 5, 10, 20];

type Phase =
  | "idle"
  | "checking-resume"
  | "uploading"
  | "paused"
  | "completing"
  | "done"
  | "error";

export function UploadPanel({
  accessToken,
  user,
  onLogout,
}: {
  accessToken: string;
  user: AuthUser;
  onLogout: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSizeMB, setChunkSizeMB] = useState(5);
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [totalChunks, setTotalChunks] = useState(0);
  const [receivedChunks, setReceivedChunks] = useState<Set<number>>(new Set());
  const [resumedFromPrevious, setResumedFromPrevious] = useState(false);
  const [completedResult, setCompletedResult] = useState<CompleteUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  function resetForNewFile() {
    abortControllerRef.current?.abort();
    setPhase("idle");
    setUploadId(null);
    setTotalChunks(0);
    setReceivedChunks(new Set());
    setResumedFromPrevious(false);
    setCompletedResult(null);
    setErrorMessage(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    resetForNewFile();
    setFile(e.target.files?.[0] ?? null);
  }

  async function startOrResumeUpload() {
    if (!file) return;
    setErrorMessage(null);
    const chunkSizeBytes = chunkSizeMB * 1024 * 1024;

    try {
      let activeUploadId = uploadId;
      let received = receivedChunks;
      let total = totalChunks;

      if (!activeUploadId) {
        setPhase("checking-resume");
        const existing = loadResumeRecord(file.name, file.size, chunkSizeBytes);
        if (existing) {
          try {
            const s = await getUploadStatus(accessToken, existing.uploadId);
            if (s.status !== "complete") {
              activeUploadId = existing.uploadId;
              received = new Set(s.receivedChunks);
              total = s.totalChunks;
              setResumedFromPrevious(true);
            } else {
              clearResumeRecord(file.name, file.size, chunkSizeBytes);
            }
          } catch {
            // Session expired or was never valid - fall through to a fresh init.
            clearResumeRecord(file.name, file.size, chunkSizeBytes);
          }
        }

        if (!activeUploadId) {
          const init = await initUpload(accessToken, {
            fileName: file.name,
            fileSize: file.size,
            chunkSize: chunkSizeBytes,
          });
          activeUploadId = init.uploadId;
          total = init.totalChunks;
          received = new Set();
          saveResumeRecord(file.name, file.size, chunkSizeBytes, init.uploadId);
        }

        setUploadId(activeUploadId);
        setTotalChunks(total);
        setReceivedChunks(received);
      }

      setPhase("uploading");
      const controller = new AbortController();
      abortControllerRef.current = controller;

      for (let i = 0; i < total; i++) {
        if (received.has(i)) continue; // resumability: never re-send a chunk the server already has
        const start = i * chunkSizeBytes;
        const end = Math.min(start + chunkSizeBytes, file.size);
        await uploadChunk(accessToken, activeUploadId, i, file.slice(start, end), controller.signal);
        received = new Set(received);
        received.add(i);
        setReceivedChunks(received);
      }

      setPhase("completing");
      const result = await completeUpload(accessToken, activeUploadId);
      clearResumeRecord(file.name, file.size, chunkSizeBytes);
      setCompletedResult(result);
      setPhase("done");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setPhase("paused");
        return;
      }
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  }

  function pauseUpload() {
    abortControllerRef.current?.abort();
  }

  async function handleCancelUpload() {
    abortControllerRef.current?.abort();
    if (uploadId) {
      await abortUpload(accessToken, uploadId);
      if (file) clearResumeRecord(file.name, file.size, chunkSizeMB * 1024 * 1024);
    }
    resetForNewFile();
    setFile(null);
  }

  const progress = totalChunks > 0 ? receivedChunks.size / totalChunks : 0;
  const isBusy = phase === "uploading" || phase === "checking-resume" || phase === "completing";
  const pingSamples = usePingMonitor(isBusy);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800">
        <span className="text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</span>
        </span>
        <button onClick={onLogout} className="text-sky-600 hover:underline dark:text-sky-400">
          Sign out
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500" htmlFor="file">
              File
            </label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              disabled={isBusy}
              className="text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500" htmlFor="chunkSize">
              Chunk size
            </label>
            <select
              id="chunkSize"
              value={chunkSizeMB}
              onChange={(e) => setChunkSizeMB(Number(e.target.value))}
              disabled={isBusy || phase !== "idle"}
              className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
            >
              {CHUNK_SIZE_OPTIONS_MB.map((mb) => (
                <option key={mb} value={mb}>
                  {mb} MB
                </option>
              ))}
            </select>
          </div>
        </div>

        {file && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {file.name} — {formatBytes(file.size)}
            {totalChunks > 0 && ` — ${totalChunks} chunk${totalChunks === 1 ? "" : "s"}`}
          </p>
        )}

        {resumedFromPrevious && (
          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            Found an incomplete upload for this exact file in this browser — resuming from{" "}
            {receivedChunks.size}/{totalChunks} chunks already on the server, instead of starting
            over.
          </p>
        )}

        {totalChunks > 0 && (
          <div className="flex flex-col gap-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-sky-500 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: totalChunks }, (_, i) => (
                <span
                  key={i}
                  title={`chunk ${i}`}
                  className={`h-2.5 w-2.5 rounded-sm ${
                    receivedChunks.has(i)
                      ? "bg-sky-500"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              {receivedChunks.size}/{totalChunks} chunks on the server ({Math.round(progress * 100)}%)
            </p>
          </div>
        )}

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

        <PingStrip samples={pingSamples} label="Server responsiveness — ping every ~60ms" />

        <div className="flex flex-wrap gap-2">
          {phase !== "uploading" && phase !== "done" && (
            <button
              onClick={startOrResumeUpload}
              disabled={!file || phase === "checking-resume" || phase === "completing"}
              className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {phase === "paused" ? "Resume upload" : "Start upload"}
            </button>
          )}
          {phase === "uploading" && (
            <button
              onClick={pauseUpload}
              className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm dark:border-zinc-700"
            >
              Pause
            </button>
          )}
          {(uploadId || file) && phase !== "done" && (
            <button
              onClick={handleCancelUpload}
              className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm text-red-500 dark:border-zinc-700"
            >
              Cancel &amp; discard
            </button>
          )}
        </div>

        {phase === "done" && completedResult && (
          <div className="flex flex-col gap-2 rounded-md bg-emerald-500/10 px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            <p>
              Uploaded and reassembled successfully: {completedResult.fileName} (
              {formatBytes(completedResult.size)}) — then immediately deleted from the server.
              This demo doesn&apos;t retain uploaded content; there&apos;s nothing left to
              download.
            </p>
            <button
              onClick={() => {
                resetForNewFile();
                setFile(null);
              }}
              className="self-start rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Upload another file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
