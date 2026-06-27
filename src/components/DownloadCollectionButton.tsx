import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";

type Item = {
  id: string;
  title: string | null;
  storage_path: string;
  media_type: "image" | "video";
  mime_type: string | null;
};

export function DownloadCollectionButton({
  items,
  collectionTitle,
}: {
  items: Item[];
  collectionTitle: string;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const safe = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80) || "media";

  const downloadAll = async (mode: "original" | "compressed") => {
    if (!items.length) {
      toast.info("Nothing to download yet.");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const zip = new JSZip();
      const folder = zip.folder(safe(collectionTitle)) ?? zip;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const { data, error } = await supabase.storage
          .from("media")
          .createSignedUrl(it.storage_path, 3600);
        if (error || !data?.signedUrl) continue;

        const res = await fetch(data.signedUrl);
        let blob = await res.blob();
        let ext = (it.storage_path.split(".").pop() || "bin").toLowerCase();

        if (mode === "compressed" && it.media_type === "image") {
          try {
            const compressed = await compressImage(blob);
            if (compressed) {
              blob = compressed;
              ext = "jpg";
            }
          } catch {
            /* fall back to original */
          }
        }

        const name = `${String(i + 1).padStart(3, "0")}_${safe(it.title || "media")}.${ext}`;
        folder.file(name, blob);
        setProgress(Math.round(((i + 1) / items.length) * 100));
      }

      const out = await zip.generateAsync({ type: "blob" }, (meta) => {
        setProgress(Math.min(99, Math.round(meta.percent)));
      });

      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safe(collectionTitle)}-${mode}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success(`Downloaded ${items.length} item${items.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="rounded-full" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              {progress}%
            </>
          ) : (
            <>
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong border-white/10">
        <DropdownMenuItem onClick={() => downloadAll("original")}>
          <div className="flex flex-col">
            <span>Download all — Original (HD)</span>
            <span className="text-xs text-muted-foreground">Full quality, zipped</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadAll("compressed")}>
          <div className="flex flex-col">
            <span>Download all — Compressed</span>
            <span className="text-xs text-muted-foreground">
              Photos shrunk to ~1280px JPEG; videos as original
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function compressImage(blob: Blob): Promise<Blob | null> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("load failed"));
      img.src = url;
    });
    const MAX = 1280;
    const ratio = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * ratio);
    const h = Math.round(img.naturalHeight * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.78));
  } finally {
    URL.revokeObjectURL(url);
  }
}
