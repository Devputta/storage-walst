import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FolderOpen, Image as ImageIcon, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useServerFn } from "@tanstack/react-start";
import { ensureMediaBucketLimit } from "@/lib/storage.functions";

const CONCURRENCY = 6;

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  heic: "image/heic", heif: "image/heif", avif: "image/avif", bmp: "image/bmp", tif: "image/tiff", tiff: "image/tiff",
  mp4: "video/mp4", mov: "video/quicktime", m4v: "video/x-m4v", webm: "video/webm", mkv: "video/x-matroska",
  avi: "video/x-msvideo", "3gp": "video/3gpp", mts: "video/mp2t", ts: "video/mp2t",
};

/** Some phones/browsers give files an empty type (e.g. .HEIC, .MOV); fall back to the extension. */
function fileMime(f: File): string {
  if (f.type) return f.type;
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? "";
}
const MAX_COLLECTION_ITEMS = 1050;
const PREVIEW_LIMIT = 80;

function VideoThumb({ file }: { file: File }) {
  const [poster, setPoster] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.src = "";
    };
    const onLoaded = () => {
      try {
        v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
      } catch {
        cleanup();
      }
    };
    const onSeeked = () => {
      try {
        const w = 240;
        const h = Math.round((v.videoHeight / v.videoWidth) * w) || 240;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(v, 0, 0, w, h);
          const data = c.toDataURL("image/jpeg", 0.7);
          if (!cancelled) setPoster(data);
        }
      } catch {
        // ignore
      } finally {
        cleanup();
      }
    };
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("error", cleanup);
    return () => {
      cancelled = true;
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("error", cleanup);
      cleanup();
    };
  }, [file]);
  return (
    <div className="relative h-full w-full bg-black">
      {poster ? (
        <img src={poster} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/50">
          <Play className="h-6 w-6" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-black/50 p-1.5">
          <Play className="h-3 w-3 fill-white text-white" />
        </div>
      </div>
    </div>
  );
}

export function UploadDialog({ collectionId }: { collectionId: string }) {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const raiseLimit = useServerFn(ensureMediaBucketLimit);

  const { data: existingCount = 0 } = useQuery({
    queryKey: ["media-count", collectionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", collectionId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) raiseLimit().catch(() => {});
  }, [open, raiseLimit]);

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const all = Array.from(list);
    const arr = all.filter((f) => {
      const m = fileMime(f);
      return m.startsWith("image") || m.startsWith("video");
    });
    if (arr.length < all.length) {
      toast.info(`${all.length - arr.length} file${all.length - arr.length === 1 ? " isn't" : "s aren't"} a photo or video and was skipped.`);
    }
    setFiles((prev) => {
      const slotsLeft = Math.max(0, MAX_COLLECTION_ITEMS - existingCount - prev.length);
      if (slotsLeft === 0) {
        toast.error("This collection already has the 1,050 item limit.");
        return prev;
      }
      if (arr.length > slotsLeft) {
        toast.info(`Added ${slotsLeft} file${slotsLeft === 1 ? "" : "s"}; each collection holds 1,050 items.`);
      }
      return [...prev, ...arr.slice(0, slotsLeft)];
    });
  };

  const reset = () => {
    setFiles([]); setTitle(""); setDescription(""); setDone(0);
  };

  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    setDone(0);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { count, error: countError } = await supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", collectionId);
      if (countError) throw countError;
      const remaining = MAX_COLLECTION_ITEMS - (count ?? 0);
      if (files.length > remaining) {
        throw new Error(
          remaining > 0
            ? `This collection can take ${remaining} more item${remaining === 1 ? "" : "s"}.`
            : "This collection is full at 1,050 items.",
        );
      }
      const userId = u.user.id;
      const total = files.length;
      let coverPath: string | null = null;
      let completed = 0;
      let failed = 0;

      const failedFiles: File[] = [];
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const uploadOne = async (f: File) => {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${userId}/${collectionId}/${crypto.randomUUID()}.${ext}`;
        const mime = fileMime(f);
        try {
          let lastErr: unknown = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            const { error: upErr } = await supabase.storage.from("media").upload(path, f, {
              contentType: mime,
              upsert: true,
            });
            if (!upErr) { lastErr = null; break; }
            lastErr = upErr;
            await sleep(800 * (attempt + 1));
          }
          if (lastErr) throw lastErr;
          const mediaType = mime.startsWith("video") ? "video" : "image";
          const { error: insErr } = await supabase.from("media").insert({
            user_id: userId,
            collection_id: collectionId,
            title: title || f.name.replace(/\.[^.]+$/, ""),
            description: description || null,
            storage_path: path,
            media_type: mediaType,
            mime_type: mime,
            size_bytes: f.size,
          });
          if (insErr) {
            await supabase.storage.from("media").remove([path]);
            throw insErr;
          }
          if (!coverPath && mediaType === "image") coverPath = path;
        } catch (e) {
          failed++;
          failedFiles.push(f);
          console.error("upload failed", f.name, e);
        } finally {
          completed++;
          setDone(completed);
        }
      };

      // Concurrency-limited parallel uploads (fewer at once for very large files)
      const queue = [...files].sort((a, b) => a.size - b.size);
      const big = files.some((f) => f.size > 200 * 1024 * 1024);
      const workers = Array.from({ length: Math.min(big ? 3 : CONCURRENCY, queue.length) }, async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          await uploadOne(next);
        }
      });
      await Promise.all(workers);

      if (coverPath) {
        await supabase.from("collections").update({ cover_url: coverPath }).eq("id", collectionId).is("cover_url", null);
      }
      const ok = total - failed;
      if (ok) toast.success(`Uploaded ${ok} item${ok > 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["media", collectionId] });
      qc.invalidateQueries({ queryKey: ["media-count", collectionId] });
      qc.invalidateQueries({ queryKey: ["collections"] });
      if (failed) {
        toast.error(`${failed} file${failed > 1 ? "s" : ""} didn't upload — they're kept here, press Upload to retry.`);
        setFiles(failedFiles);
        setDone(0);
        return;
      }
      reset(); setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(false); }
  };

  const progressPct = files.length ? Math.round((done / files.length) * 100) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // Prevent closing the dialog while uploading — that's what caused
        // taps outside / accidental dismisses to "restart" your upload.
        if (busy && !o) return;
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Upload className="mr-1.5 h-4 w-4" /> Upload
        </Button>
      </DialogTrigger>
      <DialogContent
        className="glass-strong border-white/10 sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => { if (busy) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }}
        onInteractOutside={(e) => { if (busy) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add to collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            hidden
            onChange={(e) => { onPick(e.target.files); e.target.value = ""; }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            hidden
            // @ts-expect-error non-standard attributes for folder selection
            webkitdirectory=""
            directory=""
            onChange={(e) => { onPick(e.target.files); e.target.value = ""; }}
          />

          <div
            className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files); }}
          >
            <Upload className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Drop files anywhere, or</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full"
                disabled={busy}
              >
                <ImageIcon className="mr-1.5 h-4 w-4" /> Select files
              </Button>
              {!isMobile && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => folderInputRef.current?.click()}
                  className="rounded-full"
                  disabled={busy}
                >
                  <FolderOpen className="mr-1.5 h-4 w-4" /> Select folder
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Photos & videos up to 1 GB each. Up to 1,050 items per collection.
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {files.length} file{files.length > 1 ? "s" : ""} ready · {Math.max(0, MAX_COLLECTION_ITEMS - existingCount - files.length)} slots left
                </p>
                {!busy && (
                  <button
                    onClick={() => setFiles([])}
                    className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl bg-black/20 p-2">
                <div className="grid grid-cols-4 gap-2">
                  {files.slice(0, PREVIEW_LIMIT).map((f, i) => {
                    const isVideo = f.type.startsWith("video");
                    return (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10 bg-black">
                        {isVideo ? (
                          <VideoThumb file={f} />
                        ) : (
                          <img src={URL.createObjectURL(f)} className="h-full w-full object-cover" alt="" />
                        )}
                        {!busy && (
                          <button
                            onClick={() => setFiles(files.filter((_, j) => j !== i))}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {files.length > PREVIEW_LIMIT && (
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-white/5 p-2 text-center text-xs text-muted-foreground ring-1 ring-white/10">
                      +{files.length - PREVIEW_LIMIT} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-xl bg-input/40"
            disabled={busy}
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[70px] rounded-xl bg-input/40"
            disabled={busy}
          />

          {busy && (
            <div className="space-y-1.5">
              <Progress value={progressPct} />
              <p className="text-xs text-muted-foreground text-center">
                {done} / {files.length} uploaded — keep this window open
              </p>
            </div>
          )}

          <Button onClick={upload} disabled={busy || files.length === 0} className="h-11 w-full rounded-xl">
            {busy ? `Uploading ${progressPct}%` : `Upload ${files.length || ""}`.trim()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
