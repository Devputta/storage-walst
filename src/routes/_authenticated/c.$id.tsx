import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarArrowDown,
  CalendarArrowUp,
  ChevronLeft,
  ChevronRight,
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
  Eye,
  EyeOff,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

import { UploadDialog } from "@/components/UploadDialog";
import { PinDialog } from "@/components/PinDialog";
import { CollectionSettingsDialog } from "@/components/CollectionSettingsDialog";
import { CollectionEditDialog } from "@/components/CollectionEditDialog";
import { DownloadCollectionButton } from "@/components/DownloadCollectionButton";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

import { useSignedUrl } from "@/lib/storage";
import { revokeCollectionUnlock } from "@/lib/collections.functions";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/c/$id")({
  head: () => ({
    meta: [
      { title: "Collection — Lumen private gallery" },
      {
        name: "description",
        content: "View, organize and protect the photos and videos in your private Lumen collection.",
      },
      { property: "og:title", content: "Collection — Lumen private gallery" },
      {
        property: "og:description",
        content: "A private collection for viewing, editing and keeping your personal media.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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
  created_at: string;
};

type Collection = {
  id: string;
  title: string;
  description: string | null;
  nickname: string | null;
  is_private: boolean;
  has_pin: boolean;
  is_invisible: boolean;
  created_at: string;
};

type ViewMode = "grid" | "list";
type SortMode = "newest" | "oldest" | "name-asc" | "name-desc";

const PAGE_SIZE = 60;
const IDLE_LOCK_MS = 15 * 60 * 1000;
const RECENT_KEY = "lumen.recentCollections";

function CollectionPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "image" | "video" | "favorite">("all");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("lumen.viewMode") as ViewMode) || "grid";
  });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const revokeUnlock = useServerFn(revokeCollectionUnlock);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lumen.viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filter, id, search, sortMode]);

  const lockCollection = useCallback(async (showMessage = true) => {
    if (!unlocked) return;
    const result = await revokeUnlock({ data: { collectionId: id } });
    if (!result.ok) {
      toast.error("The collection could not be locked. Try again.");
      return;
    }
    setUnlocked(false);
    setLightboxIndex(null);
    qc.removeQueries({ queryKey: ["media", id] });
    if (showMessage) toast.success("Collection locked");
  }, [id, qc, revokeUnlock, unlocked]);

  useEffect(() => {
    if (!unlocked) return;
    let timer: number | undefined;
    const resetTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void lockCollection(false).then(() => toast.info("This collection was locked after inactivity."));
      }, IDLE_LOCK_MS);
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [lockCollection, unlocked]);

  const { data: collection } = useQuery({
    queryKey: ["collection", id],
    queryFn: async (): Promise<Collection | null> => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,title,description,nickname,is_private,has_pin,is_invisible,created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Collection | null;
    },
  });

  useEffect(() => {
    if (!collection) return;
    try {
      const existing = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as Array<{ id: string; visitedAt: number }>;
      const next = [{ id: collection.id, visitedAt: Date.now() }, ...existing.filter((item) => item.id !== collection.id)].slice(0, 8);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Recent history is a convenience; private media never depends on it.
    }
  }, [collection]);

  const needsPin = !!(collection?.is_private && collection?.has_pin && !unlocked);

  const { data: media } = useQuery({
    queryKey: ["media", id],
    queryFn: async (): Promise<Media[]> => {
      const { data, error } = await supabase
        .from("media")
        .select("id,title,description,storage_path,media_type,mime_type,is_favorite,created_at")
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
    const query = search.trim().toLowerCase();
    const matching = list.filter((m) => {
      if (filter === "favorite" && !m.is_favorite) return false;
      if (filter !== "all" && filter !== "favorite" && m.media_type !== filter) return false;
      if (!query) return true;
      return [m.title, m.description].some((value) => value?.toLowerCase().includes(query));
    });

    return [...matching].sort((a, b) => {
      if (sortMode === "name-asc" || sortMode === "name-desc") {
        const result = (a.title || "Untitled").localeCompare(b.title || "Untitled", undefined, { sensitivity: "base" });
        return sortMode === "name-asc" ? result : -result;
      }
      const result = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortMode === "newest" ? -result : result;
    });
  }, [media, filter, search, sortMode]);

  const favCount = useMemo(() => (media ?? []).filter((m) => m.is_favorite).length, [media]);

  const onFavorite = async (m: Media) => {
    await supabase.from("media").update({ is_favorite: !m.is_favorite }).eq("id", m.id);
    toast.success(m.is_favorite ? "Removed from favorites" : "Added to favorites");
    qc.invalidateQueries({ queryKey: ["media", id] });
  };

  const onToggleHidden = async () => {
    if (!collection) return;
    const next = !collection.is_invisible;
    const { error } = await supabase.from("collections").update({ is_invisible: next }).eq("id", id);
    if (error) { toast.error("Could not update visibility"); return; }
    toast.success(next ? "Collection hidden" : "Collection unhidden");
    qc.invalidateQueries({ queryKey: ["collection", id] });
    qc.invalidateQueries({ queryKey: ["collections"] });
  };

  const onDeleteCollection = async () => {
    if (!collection) return;
    if (!confirm(`Delete “${collection.title}” and all its photos and videos? This cannot be undone.`)) return;

    try {
      const { data: items, error: mediaError } = await supabase
        .from("media")
        .select("storage_path")
        .eq("collection_id", id)
        .range(0, 1049);
      if (mediaError) throw mediaError;

      const paths = (items ?? []).map((item) => item.storage_path).filter(Boolean);
      for (let i = 0; i < paths.length; i += 100) {
        const { error } = await supabase.storage.from("media").remove(paths.slice(i, i + 100));
        if (error) throw error;
      }

      const { error: deleteMediaError } = await supabase.from("media").delete().eq("collection_id", id);
      if (deleteMediaError) throw deleteMediaError;
      const { error: deleteCollectionError } = await supabase.from("collections").delete().eq("id", id);
      if (deleteCollectionError) throw deleteCollectionError;

      toast.success("Collection deleted");
      qc.invalidateQueries({ queryKey: ["collections"] });
      navigate({ to: "/app" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete collection");
    }
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
          <Button
            type="button"
            variant="ghost"
          onClick={() => navigate({ to: "/app" })}
            className="-ml-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All collections
          </Button>
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
            {(["all", "image", "video", "favorite"] as const).map((f) => (
              <Button
                type="button"
                variant="ghost"
                key={f}
                onClick={() => setFilter(f)}
                className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs uppercase tracking-wider transition ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "image" ? "Photos" : f === "video" ? "Videos" : (
                  <><Heart className="h-3 w-3" /> {favCount || ""}</>
                )}
              </Button>
            ))}
          </div>
          <div className="glass flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 sm:max-w-xs">
            <Search aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              aria-label="Search photos and videos"
              placeholder="Search media"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            />
            {search && (
              <Button type="button" variant="ghost" size="icon" aria-label="Clear search" onClick={() => setSearch("")} className="h-7 w-7 shrink-0 rounded-full">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="rounded-full" aria-label="Sort media">
                <SlidersHorizontal className="mr-1.5 h-4 w-4 text-primary" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-white/10">
              <DropdownMenuItem onClick={() => setSortMode("newest")}>
                <CalendarArrowDown className="mr-2 h-4 w-4" /> Newest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("oldest")}>
                <CalendarArrowUp className="mr-2 h-4 w-4" /> Oldest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("name-asc")}>
                <ArrowDownAZ className="mr-2 h-4 w-4" /> Name A–Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("name-desc")}>
                <ArrowUpAZ className="mr-2 h-4 w-4" /> Name Z–A
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <button
              onClick={onToggleHidden}
              className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
            >
              {collection.is_invisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {collection.is_invisible ? "Unhide" : "Hide"}
            </button>
          )}
          {!needsPin && collection && (
            <CollectionEditDialog
              collectionId={id}
              currentTitle={collection.title}
              currentDescription={collection.description}
            />
          )}
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
          {!needsPin && collection && (
            <Button
              variant="destructive"
              onClick={onDeleteCollection}
              className="rounded-full"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete collection
            </Button>
          )}
        </div>
      </section>

       {!needsPin && collection && (
        <section className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border/60 py-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            {collection.description || "A private space for your favorite frames."}
          </p>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{media?.length ?? 0} items</span>
          <span className="text-xs uppercase tracking-wider text-primary">
            Created {new Date(collection.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {collection.has_pin && (
            <Button type="button" variant="ghost" onClick={() => void lockCollection()} className="ml-auto h-8 rounded-full px-3 text-xs">
              <Lock className="mr-1.5 h-3.5 w-3.5" /> Lock now
            </Button>
          )}
        </section>
      )}

      <section className="mt-10">
        {filtered.length === 0 ? (
          <div className="glass mt-12 rounded-3xl py-24 text-center text-muted-foreground">
            <p>{search ? "No media matches your search." : filter === "favorite" ? "No favorites in this collection yet." : "Empty for now. Upload your first frame."}</p>
          </div>
        ) : viewMode === "grid" ? (
          <>
            <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
              {filtered.slice(0, visibleCount).map((m) => (
                <MediaTile
                  key={m.id}
                  m={m}
                  onOpen={() => setLightboxIndex(filtered.findIndex((item) => item.id === m.id))}
                  onFavorite={() => onFavorite(m)}
                  onDelete={() => onDelete(m)}
                />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="mt-6 flex justify-center">
                 <Button
                   type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                   variant="secondary"
                   className="rounded-full"
                >
                  Load more ({filtered.length - visibleCount} left)
                 </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {filtered.slice(0, visibleCount).map((m) => (
                <MediaRow
                  key={m.id}
                  m={m}
                  onOpen={() => setLightboxIndex(filtered.findIndex((item) => item.id === m.id))}
                  onFavorite={() => onFavorite(m)}
                  onDelete={() => onDelete(m)}
                />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="mt-6 flex justify-center">
                 <Button
                   type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                   variant="secondary"
                   className="rounded-full"
                >
                  Load more ({filtered.length - visibleCount} left)
                 </Button>
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
  const tileRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const { data: url, isError } = useSignedUrl(m.storage_path, isNearViewport);
  const [failed, setFailed] = useState(false);
  const unavailable = failed || isError;

  useEffect(() => {
    const node = tileRef.current;
    if (!node || isNearViewport) return;
    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isNearViewport]);

  useEffect(() => setFailed(false), [url]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      ref={tileRef}
      className="group relative break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-white/5"
    >
      <button onClick={onOpen} className="block w-full">
        {url && !unavailable ? (
          m.media_type === "image" ? (
            <img
              src={url}
              alt={m.title ?? "Photo"}
              className="w-full"
              loading="lazy"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="relative w-full bg-black">
              <video
                src={`${url}#t=0.5`}
                className="w-full"
                muted
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 backdrop-blur">
                  <Video className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
            </div>
          )
        ) : unavailable ? (
          <MediaUnavailable compact />
        ) : (
          <div className="aspect-[3/4] w-full animate-pulse bg-muted/50" />
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
  const rowRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const { data: url, isError } = useSignedUrl(m.storage_path, isNearViewport);
  const [failed, setFailed] = useState(false);
  const unavailable = failed || isError;

  useEffect(() => {
    const node = rowRef.current;
    if (!node || isNearViewport) return;
    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isNearViewport]);

  useEffect(() => setFailed(false), [url]);

  return (
    <div ref={rowRef} className="glass flex items-center gap-3 rounded-2xl p-2 ring-1 ring-white/5">
      <button
        onClick={onOpen}
        className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-black"
      >
        {url && !unavailable ? (
          m.media_type === "image" ? (
            <img
              src={url}
              alt={m.title ?? "Photo"}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="relative h-full w-full">
              <video
                src={`${url}#t=0.5`}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55">
                  <Video className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          )
        ) : unavailable ? (
          <MediaUnavailable compact />
        ) : (
          <div className="h-full w-full animate-pulse bg-muted/50" />
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
  const viewerRef = useRef<HTMLDivElement>(null);

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
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, onClose]);

  return (
    <motion.div
      ref={viewerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Media viewer, item ${index + 1} of ${items.length}`}
      tabIndex={-1}
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

      <div className="absolute left-4 top-4 z-20 hidden items-center gap-2 sm:flex">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous media"
          title="Previous"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="glass-strong h-10 w-10 rounded-full text-overlay-foreground disabled:opacity-35"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next media"
          title="Next"
          onClick={() => goTo(index + 1)}
          disabled={index === items.length - 1}
          className="glass-strong h-10 w-10 rounded-full text-overlay-foreground disabled:opacity-35"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Enter fullscreen"
          title="Fullscreen"
          onClick={() => viewerRef.current?.requestFullscreen?.()}
          className="glass-strong h-10 w-10 rounded-full text-overlay-foreground"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

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
        <div className="relative h-full w-full">
          {items.map((m, i) => {
            const offset = i - index;
            if (Math.abs(offset) > 1) return null;
            return (
              <div
                key={m.id}
                className="absolute inset-0 flex items-center justify-center overflow-hidden transition-transform duration-300 ease-out"
                style={{ transform: `translate3d(0, ${offset * 100}dvh, 0)` }}
              >
                <ReelSlide
                  m={m}
                  active={i === index}
                  onFavorite={() => onFavorite(m)}
                  onDelete={() => { onDelete(m); }}
                  onMetaUpdated={onMetaUpdated}
                />
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
  const { data: url, isError } = useSignedUrl(m.storage_path);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState(1);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(m.title ?? "");
  const [desc, setDesc] = useState(m.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(m.title ?? "");
    setDesc(m.description ?? "");
    setFailed(false);
    setScale(1);
  }, [m.id, m.title, m.description]);

  useEffect(() => {
    if (!active) setScale(1);
  }, [active]);

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

  const clampScale = (value: number) => Math.min(4, Math.max(1, value));
  const adjustScale = (amount: number) => setScale((value) => clampScale(value + amount));
  const resetScale = () => setScale(1);
  const pointerDistance = () => {
    const points = Array.from(pointersRef.current.values());
    const first = points[0];
    const second = points[1];
    if (!first || !second) return null;
    return Math.hypot(first.x - second.x, first.y - second.y);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const distance = pointerDistance();
    if (distance) pinchStartRef.current = { distance, scale };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const distance = pointerDistance();
    const pinchStart = pinchStartRef.current;
    if (distance && pinchStart) {
      setScale(clampScale(pinchStart.scale * (distance / pinchStart.distance)));
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
  };

  const unavailable = failed || isError;

  return (
    <>
      <div
        className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={(event) => {
          if (m.media_type === "image") {
            event.stopPropagation();
            adjustScale(event.deltaY < 0 ? 0.2 : -0.2);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: m.media_type === "image" ? "none" : "auto" }}
      >
        {url && !unavailable ? (
          m.media_type === "image" ? (
            <img
              src={url}
              alt={m.title ?? "Photo"}
              className="h-full w-full object-contain transition-transform duration-150"
              loading="eager"
              draggable={false}
              onError={() => setFailed(true)}
              style={{ transform: `scale(${scale})` }}
            />
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
              onError={() => setFailed(true)}
              className="h-full w-full object-contain"
            />
          )
        ) : (
          <MediaUnavailable />
        )}
      </div>

      {m.media_type === "image" && url && !unavailable && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-full glass-strong p-1" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out" onClick={() => adjustScale(-0.25)} disabled={scale <= 1} className="h-9 w-9 rounded-full text-overlay-foreground disabled:opacity-40">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-12 text-center text-xs text-overlay-foreground">{Math.round(scale * 100)}%</span>
          <Button type="button" variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in" onClick={() => adjustScale(0.25)} disabled={scale >= 4} className="h-9 w-9 rounded-full text-overlay-foreground disabled:opacity-40">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Reset zoom" title="Reset zoom" onClick={resetScale} disabled={scale === 1} className="h-9 w-9 rounded-full text-overlay-foreground disabled:opacity-40">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

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

function MediaUnavailable({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-2 bg-muted/60 text-center text-muted-foreground ${compact ? "aspect-[3/4] min-h-20 p-3" : "h-3/4 max-h-[28rem] min-h-48 max-w-2xl rounded-2xl p-8"}`}>
      <AlertTriangle className={compact ? "h-4 w-4" : "h-7 w-7"} />
      <span className={compact ? "text-[10px]" : "text-sm"}>Media unavailable</span>
    </div>
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
