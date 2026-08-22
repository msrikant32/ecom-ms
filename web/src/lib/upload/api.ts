const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export interface InitUploadResult {
  uploadId: string;
  totalChunks: number;
  chunkSize: number;
}

export interface UploadStatus {
  uploadId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  receivedChunks: number[];
  status: "in-progress" | "complete";
}

export interface CompleteUploadResult {
  uploadId: string;
  fileName: string;
  size: number;
}

export interface SyncUploadResult {
  fileName: string;
  size: number;
  blockedForMs: number;
}

async function extractErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const body = await res.json();
    return body?.error?.message;
  } catch {
    return undefined;
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error((await extractErrorMessage(res)) ?? `Login failed (${res.status})`);
  }
  return res.json();
}

export async function initUpload(
  accessToken: string,
  params: { fileName: string; fileSize: number; chunkSize: number }
): Promise<InitUploadResult> {
  const res = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(
      (await extractErrorMessage(res)) ?? `Failed to start upload (${res.status})`
    );
  }
  const { data } = await res.json();
  return data;
}

export async function getUploadStatus(
  accessToken: string,
  uploadId: string
): Promise<UploadStatus> {
  const res = await fetch(`${API_BASE}/uploads/${uploadId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(
      (await extractErrorMessage(res)) ?? `Failed to fetch status (${res.status})`
    );
  }
  const { data } = await res.json();
  return data;
}

// Sends one chunk as a raw binary PUT body. The server pipes this straight
// to disk without buffering it whole — see uploadService.js on the backend
// for the other half of that story.
export async function uploadChunk(
  accessToken: string,
  uploadId: string,
  index: number,
  blob: Blob,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE}/uploads/${uploadId}/chunks/${index}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `Bearer ${accessToken}`,
    },
    body: blob,
    signal,
  });
  if (!res.ok) {
    throw new Error(
      (await extractErrorMessage(res)) ?? `Chunk ${index} failed (${res.status})`
    );
  }
}

export async function completeUpload(
  accessToken: string,
  uploadId: string
): Promise<CompleteUploadResult> {
  const res = await fetch(`${API_BASE}/uploads/${uploadId}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(
      (await extractErrorMessage(res)) ?? `Failed to complete upload (${res.status})`
    );
  }
  const { data } = await res.json();
  return data;
}

export async function abortUpload(accessToken: string, uploadId: string): Promise<void> {
  await fetch(`${API_BASE}/uploads/${uploadId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// The naive counterpart to the chunked/async flow: the whole file in one
// request, written server-side with a blocking fs.writeFileSync().
export async function uploadSync(
  accessToken: string,
  file: File,
  signal?: AbortSignal
): Promise<SyncUploadResult> {
  const res = await fetch(`${API_BASE}/uploads/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `Bearer ${accessToken}`,
      "X-Upload-Filename": file.name,
    },
    body: file,
    signal,
  });
  if (!res.ok) {
    throw new Error(
      (await extractErrorMessage(res)) ?? `Sync upload failed (${res.status})`
    );
  }
  const { data } = await res.json();
  return data;
}

// Round-trips a trivial GET request and times it client-side — used to
// visualize whether the server's event loop is free to respond promptly
// or is stuck inside a blocking call.
export async function ping(): Promise<{ latencyMs: number }> {
  const start = performance.now();
  const res = await fetch(`${API_BASE}/ping`);
  if (!res.ok) throw new Error(`Ping failed (${res.status})`);
  await res.json();
  return { latencyMs: performance.now() - start };
}
