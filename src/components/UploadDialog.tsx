import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FolderOpen, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useServerFn } from "@tanstack/react-start";
import { ensureMediaBucketLimit } from "@/lib/storage.functions";

const CONCURRENCY = 4;
const MAX_COLLECTION_ITEMS = 1050;

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
    const arr = Array.from(list).filter(
      (f) => f.type.startsWith("image") || f.type.startsWith("video"),
    );
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

      const uploadOne = async (f: File) => {
        try {
          const ext = f.name.split(".").pop() ?? "bin";
          const path = `${userId}/${collectionId}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("media").upload(path, f, {
            contentType: f.type || "application/octet-stream",
            upsert: false,
          });
          if (upErr) throw upErr;
          const mediaType = f.type.startsWith("video") ? "video" : "image";
          await supabase.from("media").insert({
            user_id: userId,
            collection_id: collectionId,
            title: title || f.name.replace(/\.[^.]+$/, ""),
            description: description || null,
            storage_path: path,
            media_type: mediaType,
            mime_type: f.type,
            size_bytes: f.size,
          });
          if (!coverPath && mediaType === "image") coverPath = path;
        } catch (e) {
          failed++;
          console.error("upload failed", f.name, e);
        } finally {
          completed++;
          setDone(completed);
        }
      };

      // Concurrency-limited parallel uploads
      const queue = [...files];
      const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
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
      if (failed) toast.error(`${failed} file${failed > 1 ? "s" : ""} failed`);
      qc.invalidateQueries({ queryKey: ["media", collectionId] });
      qc.invalidateQueries({ queryKey: ["media-count", collectionId] });
      qc.invalidateQueries({ queryKey: ["collections"] });
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
                  {files.map((f, i) => {
                    const url = URL.createObjectURL(f);
                    return (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10">
                        {f.type.startsWith("video") ? (
                          <video src={`${url}#t=0.1`} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                        ) : (
                          <img src={url} className="h-full w-full object-cover" alt="" />
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
