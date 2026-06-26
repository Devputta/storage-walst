import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FolderOpen, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

export function UploadDialog({ collectionId }: { collectionId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter(
      (f) => f.type.startsWith("image") || f.type.startsWith("video"),
    );
    setFiles((prev) => [...prev, ...arr]);
  };

  const reset = () => {
    setFiles([]); setTitle(""); setDescription(""); setProgress(0);
  };

  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const total = files.length;
      let coverPath: string | null = null;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = f.name.split(".").pop() ?? "bin";
        const path = `${u.user.id}/${collectionId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, f, {
          contentType: f.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        const mediaType = f.type.startsWith("video") ? "video" : "image";
        await supabase.from("media").insert({
          user_id: u.user.id,
          collection_id: collectionId,
          title: title || f.name.replace(/\.[^.]+$/, ""),
          description: description || null,
          storage_path: path,
          media_type: mediaType,
          mime_type: f.type,
          size_bytes: f.size,
        });
        if (!coverPath && mediaType === "image") {
          coverPath = path;
        }
        setProgress(Math.round(((i + 1) / total) * 100));
      }
      if (coverPath) {
        await supabase.from("collections").update({ cover_url: coverPath }).eq("id", collectionId).is("cover_url", null);
      }
      toast.success(`Uploaded ${total} item${total > 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["media", collectionId] });
      qc.invalidateQueries({ queryKey: ["collections"] });
      reset(); setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Upload className="mr-1.5 h-4 w-4" /> Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/10 sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add to collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* hidden inputs */}
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
              >
                <ImageIcon className="mr-1.5 h-4 w-4" /> Select files
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => folderInputRef.current?.click()}
                className="rounded-full"
              >
                <FolderOpen className="mr-1.5 h-4 w-4" /> Select folder
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Photos and videos — no item limit</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {files.length} file{files.length > 1 ? "s" : ""} ready
                </p>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl bg-black/20 p-2">
                <div className="grid grid-cols-4 gap-2">
                  {files.map((f, i) => {
                    const url = URL.createObjectURL(f);
                    return (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10">
                        {f.type.startsWith("video") ? (
                          <video
                            src={`${url}#t=0.1`}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img src={url} className="h-full w-full object-cover" alt="" />
                        )}
                        <button
                          onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60"
                        >
                          <X className="h-3 w-3" />
                        </button>
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
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[70px] rounded-xl bg-input/40"
          />

          {busy && <Progress value={progress} />}

          <Button onClick={upload} disabled={busy || files.length === 0} className="h-11 w-full rounded-xl">
            {busy ? `Uploading ${progress}%` : `Upload ${files.length || ""}`.trim()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
