import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Heart, Trash2, ImageIcon, Video, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { UploadDialog } from "@/components/UploadDialog";
import { PinDialog } from "@/components/PinDialog";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/_authenticated/c/$id")({
  component: CollectionPage,
});

type Media = {
  id: string;
  title: string | null;
  storage_path: string;
  media_type: "image" | "video";
  mime_type: string | null;
  is_favorite: boolean;
};

type Collection = {
  id: string;
  title: string;
  is_private: boolean;
  pin_hash: string | null;
};

export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["sign", path],
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from("media").createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!path,
    staleTime: 1000 * 60 * 50,
  });
}

function CollectionPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const { data: collection } = useQuery({
    queryKey: ["collection", id],
    queryFn: async (): Promise<Collection | null> => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,title,is_private,pin_hash")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Collection | null;
    },
  });

  const needsPin = !!(collection?.is_private && collection?.pin_hash && !unlocked);

  const { data: media } = useQuery({
    queryKey: ["media", id],
    queryFn: async (): Promise<Media[]> => {
      const { data, error } = await supabase
        .from("media")
        .select("id,title,storage_path,media_type,mime_type,is_favorite")
        .eq("collection_id", id)
        .order("created_at", { ascending: false });
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

  return (
    <AppShell>
      <PinDialog
        open={needsPin}
        expectedHash={collection?.pin_hash ?? ""}
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
          {collection?.title ?? "Collection"}
        </motion.h1>

        <div className="flex items-center gap-2">
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
          {!needsPin && <UploadDialog collectionId={id} />}
        </div>
      </section>

      <section className="mt-10">
        {filtered.length === 0 ? (
          <div className="glass mt-12 rounded-3xl py-24 text-center text-muted-foreground">
            <p>Empty for now. Upload your first frame.</p>
          </div>
        ) : (
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
            {filtered.map((m, i) => (
              <MediaTile
                key={m.id}
                m={m}
                onOpen={() => setLightboxIndex(i)}
                onFavorite={async () => {
                  await supabase.from("media").update({ is_favorite: !m.is_favorite }).eq("id", m.id);
                  qc.invalidateQueries({ queryKey: ["media", id] });
                  qc.invalidateQueries({ queryKey: ["favorites"] });
                }}
                onDelete={async () => {
                  if (!confirm("Delete this item?")) return;
                  await supabase.storage.from("media").remove([m.storage_path]);
                  await supabase.from("media").delete().eq("id", m.id);
                  toast.success("Deleted");
                  qc.invalidateQueries({ queryKey: ["media", id] });
                }}
              />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <Lightbox
            items={filtered}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndex={setLightboxIndex}
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
            <video src={url} className="w-full" muted playsInline preload="metadata" />
          )
        ) : (
          <div className="aspect-[3/4] w-full animate-pulse bg-white/5" />
        )}
      </button>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="absolute right-2 top-2 flex translate-y-1 gap-1 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
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
      <div className="absolute bottom-2 left-2">
        <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-white/80">
          {m.media_type === "image" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
        </span>
      </div>
    </motion.div>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: Media[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const current = items[index];
  const { data: url } = useSignedUrl(current?.storage_path);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl"
      onClick={onClose}
    >
      <div className="absolute right-5 top-5 z-10 flex gap-2">
        {url && (
          <a
            href={url}
            download
            onClick={(e) => e.stopPropagation()}
            className="glass-strong flex h-10 w-10 items-center justify-center rounded-full"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={onClose}
          className="glass-strong flex h-10 w-10 items-center justify-center rounded-full"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onIndex((index - 1 + items.length) % items.length);
        }}
        className="glass-strong absolute left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onIndex((index + 1) % items.length);
        }}
        className="glass-strong absolute right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <motion.div
        key={current.id}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative max-h-[88vh] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {url ? (
          current.media_type === "image" ? (
            <img src={url} alt={current.title ?? ""} className="max-h-[88vh] max-w-[92vw] object-contain" />
          ) : (
            <video
              src={url}
              autoPlay
              controls
              playsInline
              className="max-h-[88vh] max-w-[92vw]"
              ref={(el) => { if (el) el.playbackRate = speed; }}
            />
          )
        ) : (
          <div className="h-[60vh] w-[60vw] animate-pulse rounded-2xl bg-white/5" />
        )}
        {current.media_type === "video" && (
          <div className="glass-strong mx-auto mt-4 flex w-full max-w-md items-center gap-3 rounded-full px-5 py-2">
            <span className="text-xs text-muted-foreground">Speed</span>
            <Slider
              value={[speed]}
              min={0.5}
              max={2}
              step={0.25}
              onValueChange={(v) => setSpeed(v[0])}
              className="flex-1"
            />
            <span className="w-10 text-right text-xs">{speed.toFixed(2)}x</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// silence unused warning
void Button;
