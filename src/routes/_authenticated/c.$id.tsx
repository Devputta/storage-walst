import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Heart,
  Trash2,
  ImageIcon,
  Video,
  X,
  Download,
  LayoutGrid,
  ListChecks,
  Pencil,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

import { UploadDialog } from "@/components/UploadDialog";
import { PinDialog } from "@/components/PinDialog";
import { CollectionSettingsDialog } from "@/components/CollectionSettingsDialog";
import { DownloadCollectionButton } from "@/components/DownloadCollectionButton";
import { toast } from "sonner";

import { useSignedUrl } from "@/lib/storage";
import { useVaultUnlock } from "@/components/VaultUnlock";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/c/$id")({
  component: CollectionPage,
});

type Media = {
  id: string;
  title: string | null;
  description: string | null;
  storage_path: string;
  media_type: "image" | "video";
  mime_type: string | null;
  is_favorite: boolean;
};

type Collection = {
  id: string;
  title: string;
  nickname: string | null;
  is_private: boolean;
  has_pin: boolean;
};

type ViewMode = "grid" | "list";

const PAGE_SIZE = 60;

function CollectionPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("lumen.viewMode") as ViewMode) || "grid";
  });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const vault = useVaultUnlock();

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lumen.viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filter, id]);

  const { data: collection } = useQuery({
    queryKey: ["collection", id],
    queryFn: async (): Promise<Collection | null> => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,title,nickname,is_private,has_pin")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Collection | null;
    },
  });

  const needsPin = !!(collection?.is_private && collection?.has_pin && !unlocked);

  const { data: media } = useQuery({
    queryKey: ["media", id],
    queryFn: async (): Promise<Media[]> => {
      const { data, error } = await supabase
        .from("media")
        .select("id,title,description,storage_path,media_type,mime_type,is_favorite")
        .eq("collection_id", id)
        .order("created_at", { ascending: false })
        .range(0, 1049);
      if (error) throw error;
      return data as Media[];
    },
    enabled: !needsPin,
  });

  const filtered = useMemo(() => {
    const list = media ?? [];
    if (filter === "all") return list;
    return list.filter((m) => m.media_type === filter);
  }, [media, filter]);

  const onFavorite = (m: Media) => {
    vault.request(async () => {
      await supabase.from("media").update({ is_favorite: !m.is_favorite }).eq("id", m.id);
      toast.success(m.is_favorite ? "Removed from Vault" : "Added to Vault");
      qc.invalidateQueries({ queryKey: ["media", id] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    });
  };

  const onDelete = async (m: Media) => {
    if (!confirm("Delete this item?")) return;
    await supabase.storage.from("media").remove([m.storage_path]);
    await supabase.from("media").delete().eq("id", m.id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["media", id] });
  };

  return (
    <AppShell>
      <PinDialog
        open={needsPin}
        collectionId={id}
        onUnlock={() => setUnlocked(true)}
      />

      <div className="pt-4">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All collections
        </button>
      </div>

      <section className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl md:text-6xl"
        >
          {needsPin ? (collection?.nickname ?? "Locked") : (collection?.title ?? "Collection")}
        </motion.h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="glass flex items-center rounded-full p-1">
            {(["all", "image", "video"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-wider transition ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "image" ? "Photos" : "Videos"}
              </button>
            ))}
          </div>
          <div className="glass flex items-center rounded-full p-1" role="tablist" aria-label="View mode">
            <button
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={`flex items-center justify-center rounded-full px-3 py-1.5 transition ${
                viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListChecks className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`flex items-center justify-center rounded-full px-3 py-1.5 transition ${
                viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          {!needsPin && collection && (
            <CollectionSettingsDialog
              collectionId={id}
              currentNickname={collection.nickname}
              hasPin={collection.has_pin}
            />
          )}
          {!needsPin && media && media.length > 0 && (
            <DownloadCollectionButton
              items={media}
              collectionTitle={collection?.title ?? "collection"}
            />
          )}
          {!needsPin && <UploadDialog collectionId={id} />}
        </div>
      </section>

      <section className="mt-10">
        {filtered.length === 0 ? (
          <div className="glass mt-12 rounded-3xl py-24 text-center text-muted-foreground">
            <p>Empty for now. Upload your first frame.</p>
          </div>
        ) : viewMode === "grid" ? (
          <>
            <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
              {filtered.slice(0, visibleCount).map((m, i) => (
                <MediaTile
                  key={m.id}
                  m={m}
                  onOpen={() => setLightboxIndex(i)}
                  onFavorite={() => onFavorite(m)}
                  onDelete={() => onDelete(m)}
                />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="glass rounded-full px-5 py-2 text-sm hover:bg-white/5"
                >
                  Load more ({filtered.length - visibleCount} left)
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {filtered.slice(0, visibleCount).map((m, i) => (
                <MediaRow
                  key={m.id}
                  m={m}
                  onOpen={() => setLightboxIndex(i)}
                  onFavorite={() => onFavorite(m)}
                  onDelete={() => onDelete(m)}
                />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="glass rounded-full px-5 py-2 text-sm hover:bg-white/5"
                >
                  Load more ({filtered.length - visibleCount} left)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <ReelLightbox
            items={filtered}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndex={setLightboxIndex}
            onFavorite={onFavorite}
            onDelete={onDelete}
            onMetaUpdated={() => qc.invalidateQueries({ queryKey: ["media", id] })}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function MediaTile({
  m,
  onOpen,
  onFavorite,
  onDelete,
}: {
  m: Media;
  onOpen: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}) {
  const { data: url } = useSignedUrl(m.storage_path);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      className="group relative break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-white/5"
    >
      <button onClick={onOpen} className="block w-full">
        {url ? (
          m.media_type === "image" ? (
            <img src={url} alt={m.title ?? ""} className="w-full" loading="lazy" />
          ) : (
            <video
              src={`${url}#t=0.5`}
              className="w-full bg-black"
              muted
              playsInline
              preload="metadata"
            />
          )
        ) : (
          <div className="aspect-[3/4] w-full animate-pulse bg-white/5" />
        )}
      </button>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-100 transition md:opacity-0 md:group-hover:opacity-100" />
      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <button
          onClick={onFavorite}
          className="glass-strong flex h-8 w-8 items-center justify-center rounded-full"
          aria-label="favorite"
        >
          <Heart className={`h-3.5 w-3.5 ${m.is_favorite ? "fill-primary text-primary" : ""}`} />
        </button>
        <button
          onClick={onDelete}
          className="glass-strong flex h-8 w-8 items-center justify-center rounded-full"
          aria-label="delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {(m.title || m.description) && (
        <div className="absolute inset-x-2 bottom-2 space-y-0.5 text-white drop-shadow">
          {m.title && <p className="truncate text-sm font-medium">{m.title}</p>}
          {m.description && <p className="line-clamp-2 text-[11px] text-white/80">{m.description}</p>}
        </div>
      )}
      {!m.title && !m.description && (
        <div className="absolute bottom-2 left-2">
          <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-white/80">
            {m.media_type === "image" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function MediaRow({
  m,
  onOpen,
  onFavorite,
  onDelete,
}: {
  m: Media;
  onOpen: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}) {
  const { data: url } = useSignedUrl(m.storage_path);
  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-2 ring-1 ring-white/5">
      <button
        onClick={onOpen}
        className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-black"
      >
        {url ? (
          m.media_type === "image" ? (
            <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <video src={`${url}#t=0.5`} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          )
        ) : (
          <div className="h-full w-full animate-pulse bg-white/5" />
        )}
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          {m.media_type === "image" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
          {m.media_type === "image" ? "Photo" : "Video"}
        </div>
        <p className="truncate text-sm font-medium text-foreground">{m.title || "Untitled"}</p>
        {m.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
        )}
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onFavorite}
          className="glass-strong flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="favorite"
        >
          <Heart className={`h-3.5 w-3.5 ${m.is_favorite ? "fill-primary text-primary" : ""}`} />
        </button>
        <button
          onClick={onDelete}
          className="glass-strong flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ReelLightbox({
  items,
  index,
  onClose,
  onIndex,
  onFavorite,
  onDelete,
  onMetaUpdated,
}: {
  items: Media[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
  onFavorite: (m: Media) => void;
  onDelete: (m: Media) => void;
  onMetaUpdated: () => void;
}) {
  const lockRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);

  const goTo = useCallback((nextIndex: number) => {
    if (lockRef.current) return;
    const next = Math.max(0, Math.min(items.length - 1, nextIndex));
    if (next === index) return;
    lockRef.current = true;
    onIndex(next);
    window.setTimeout(() => {
      lockRef.current = false;
    }, 360);
  }, [index, items.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") goTo(index + 1);
      if (e.key === "ArrowUp") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      <button
        onClick={onClose}
        className="glass-strong absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        className="h-[100dvh] w-full overflow-hidden overscroll-contain"
        style={{ touchAction: "pan-y" }}
        onWheel={(e) => {
          if (Math.abs(e.deltaY) < 24) return;
          goTo(index + (e.deltaY > 0 ? 1 : -1));
        }}
        onTouchStart={(e) => {
          const y = e.touches[0]?.clientY ?? null;
          touchStartRef.current = y !== null && y < window.innerHeight - 120 ? y : null;
        }}
        onTouchEnd={(e) => {
          if (touchStartRef.current === null) return;
          const end = e.changedTouches[0]?.clientY ?? touchStartRef.current;
          const delta = touchStartRef.current - end;
          touchStartRef.current = null;
          if (Math.abs(delta) < 44) return;
          goTo(index + (delta > 0 ? 1 : -1));
        }}
      >
        <div
          className="h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translate3d(0, -${index * 100}dvh, 0)` }}
        >
          {items.map((m, i) => {
            const near = Math.abs(i - index) <= 2;
            return (
              <div
                key={m.id}
                className="relative flex h-[100dvh] w-full shrink-0 items-center justify-center overflow-hidden"
              >
                {near ? (
                  <ReelSlide
                    m={m}
                    active={i === index}
                    onFavorite={() => onFavorite(m)}
                    onDelete={() => { onDelete(m); }}
                    onMetaUpdated={onMetaUpdated}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-[11px] text-white/60">
        {index + 1} / {items.length}
      </div>
    </motion.div>
  );
}

function ReelSlide({
  m,
  active,
  onFavorite,
  onDelete,
  onMetaUpdated,
}: {
  m: Media;
  active: boolean;
  onFavorite: () => void;
  onDelete: () => void;
  onMetaUpdated: () => void;
}) {
  const { data: url } = useSignedUrl(m.storage_path);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(m.title ?? "");
  const [desc, setDesc] = useState(m.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(m.title ?? "");
    setDesc(m.description ?? "");
  }, [m.id, m.title, m.description]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.muted = false;
      v.play().catch(() => {
        // Browser blocked autoplay with sound — retry muted, user can unmute via controls
        v.muted = true;
        v.play().catch(() => {});
      });
    } else {
      v.pause();
    }
  }, [active, url]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("media")
      .update({ title: title.trim() || null, description: desc.trim() || null })
      .eq("id", m.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save");
      return;
    }
    toast.success("Saved");
    setEditing(false);
    onMetaUpdated();
  };

  return (
    <>
      <div className="absolute inset-0 flex h-full w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {url ? (
          m.media_type === "image" ? (
            <img src={url} alt={m.title ?? ""} className="h-full w-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              src={url}
              playsInline
              controls
              loop
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="h-full w-full object-contain"
            />
          )
        ) : (
          <div className="h-3/4 w-3/4 animate-pulse rounded-2xl bg-white/5" />
        )}
      </div>

      {/* Right-side action rail (reel-style) */}
      <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onFavorite}
          className="glass-strong flex h-11 w-11 items-center justify-center rounded-full"
          aria-label="favorite"
        >
          <Heart className={`h-4 w-4 ${m.is_favorite ? "fill-primary text-primary" : ""}`} />
        </button>
        {url && <DownloadMenu url={url} item={m} />}
        <button
          onClick={() => setEditing((v) => !v)}
          className="glass-strong flex h-11 w-11 items-center justify-center rounded-full"
          aria-label="Edit details"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="glass-strong flex h-11 w-11 items-center justify-center rounded-full"
          aria-label="delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom title/description overlay */}
      <div className={`pointer-events-none absolute inset-x-0 bottom-16 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pb-6 pr-20 [&>*]:pointer-events-auto transition-opacity duration-300 ${isPlaying && !editing ? "opacity-0" : "opacity-100"}`} onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <div className="glass-strong space-y-2 rounded-2xl p-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-60"
              >
                <Check className="h-3 w-3" /> Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-white">
            <p className="text-lg font-semibold drop-shadow">{m.title || "Untitled"}</p>
            {m.description && (
              <p className="max-w-2xl text-sm text-white/85 drop-shadow">{m.description}</p>
            )}
          </div>
        )}

      </div>
    </>
  );
}

function DownloadMenu({ url, item }: { url: string; item: Media }) {
  const [busy, setBusy] = useState(false);

  const triggerDownload = (href: string, name: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadOriginal = async () => {
    setBusy(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      triggerDownload(obj, (item.title || "media") + "-original");
      setTimeout(() => URL.revokeObjectURL(obj), 5000);
    } finally { setBusy(false); }
  };

  const downloadCompressed = async () => {
    if (item.media_type !== "image") {
      toast.info("Compression only works for photos — downloading original.");
      return downloadOriginal();
    }
    setBusy(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
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
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.78));
      if (!blob) throw new Error("encode failed");
      const obj = URL.createObjectURL(blob);
      triggerDownload(obj, (item.title || "media") + "-compressed.jpg");
      setTimeout(() => URL.revokeObjectURL(obj), 5000);
    } catch {
      toast.error("Compression failed");
    } finally { setBusy(false); }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={busy}
        className="glass-strong flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-60"
        aria-label="Download"
      >
        <Download className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong border-white/10">
        <DropdownMenuItem onClick={downloadOriginal}>
          <div className="flex flex-col">
            <span>Original (HD)</span>
            <span className="text-xs text-muted-foreground">Full quality file</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadCompressed}>
          <div className="flex flex-col">
            <span>Compressed (smaller)</span>
            <span className="text-xs text-muted-foreground">
              {item.media_type === "image" ? "~1280px JPEG" : "Video — original only"}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
