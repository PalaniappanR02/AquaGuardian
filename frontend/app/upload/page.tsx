"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// ── Constants ──────────────────────────────────────────────────────────────
const BUCKET = "complaint-media";
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Generates a unique storage path to avoid filename collisions */
function buildStoragePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `uploads/${userId}/${timestamp}_${sanitized}`;
}

/** Returns a human-readable file size string */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Types ──────────────────────────────────────────────────────────────────
type Status =
  | { type: "idle" }
  | { type: "uploading"; progress: number }
  | { type: "success"; url: string }
  | { type: "error"; message: string };

// ── Component ──────────────────────────────────────────────────────────────
export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  // ── File selection & validation ──────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setStatus({ type: "idle" });

    if (!selected) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setStatus({
        type: "error",
        message: `Unsupported file type "${selected.type}". Allowed: JPEG, PNG, WEBP, PDF, MP4.`,
      });
      setFile(null);
      return;
    }

    // Validate file size
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setStatus({
        type: "error",
        message: `File too large (${formatBytes(selected.size)}). Maximum allowed size is ${MAX_SIZE_MB} MB.`,
      });
      setFile(null);
      return;
    }

    setFile(selected);
  }

  // ── Upload handler ───────────────────────────────────────────────────────
  async function handleUpload() {
    if (!file) {
      setStatus({ type: "error", message: "Please select a file first." });
      return;
    }

    // Prevent double-submit
    if (status.type === "uploading") return;

    setStatus({ type: "uploading", progress: 0 });

    try {
      // 1. Verify authenticated session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
      if (!session) throw new Error("You must be logged in to upload files.");

      // 2. Build a unique path (prevents 409 duplicate conflicts)
      const storagePath = buildStoragePath(session.user.id, file.name);

      // 3. Upload — upsert: false because path is already unique via timestamp
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,          // safe because path is timestamp-unique
          contentType: file.type,
        });

      if (uploadError) throw new Error(uploadError.message);

      // 4. Get a public URL for confirmation/display
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      // 5. Success — reset input
      setStatus({ type: "success", url: urlData.publicUrl });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      console.error("[FileUpload]", err);
      setStatus({ type: "error", message });
    }
  }

  // ── Drag-and-drop ────────────────────────────────────────────────────────
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    // Reuse the same validation by faking a change event target
    handleFileChange({
      target: { files: e.dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  }

  const isUploading = status.type === "uploading";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-8">

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-1">Upload File</h2>
        <p className="text-sm text-slate-400 mb-6">
          Supported: JPEG, PNG, WEBP, PDF, MP4 &mdash; max {MAX_SIZE_MB} MB
        </p>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 mb-4"
        >
          {file ? (
            <div className="space-y-1">
              <p className="text-sky-400 font-semibold text-sm truncate">{file.name}</p>
              <p className="text-slate-500 text-xs">{formatBytes(file.size)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl">📁</div>
              <p className="text-slate-400 text-sm">
                Drag & drop a file here, or <span className="text-sky-400 underline">browse</span>
              </p>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors duration-200 text-sm"
        >
          {isUploading ? "Uploading…" : "Upload File"}
        </button>

        {/* Progress bar (shown while uploading) */}
        {isUploading && (
          <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full animate-pulse w-full" />
          </div>
        )}

        {/* Status Messages */}
        {status.type === "success" && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            ✅ File uploaded successfully!{" "}
            <a
              href={status.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-300"
            >
              View file
            </a>
          </div>
        )}

        {status.type === "error" && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            ❌ {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
