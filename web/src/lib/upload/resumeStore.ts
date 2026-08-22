interface ResumeRecord {
  uploadId: string;
}

function resumeKey(fileName: string, fileSize: number, chunkSize: number): string {
  return `upload-resume:${fileName}:${fileSize}:${chunkSize}`;
}

// A resumable upload has to survive more than an in-memory pause — a
// closed tab or a crashed browser is the realistic case this is meant to
// handle — so the mapping from (file, chunk size) -> uploadId lives in
// localStorage, not React state.
export function saveResumeRecord(
  fileName: string,
  fileSize: number,
  chunkSize: number,
  uploadId: string
): void {
  localStorage.setItem(
    resumeKey(fileName, fileSize, chunkSize),
    JSON.stringify({ uploadId } satisfies ResumeRecord)
  );
}

export function loadResumeRecord(
  fileName: string,
  fileSize: number,
  chunkSize: number
): ResumeRecord | null {
  const raw = localStorage.getItem(resumeKey(fileName, fileSize, chunkSize));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearResumeRecord(
  fileName: string,
  fileSize: number,
  chunkSize: number
): void {
  localStorage.removeItem(resumeKey(fileName, fileSize, chunkSize));
}
