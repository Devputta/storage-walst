import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Play, ImagePlus, X, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrl } from "@/lib/storage";

export type RecentItem = {
  id: string;
  title: string | null;
  description: string | null;
  storage_path: string;
  media_type: string;
  collection_id: string | null;
};

function Tile({ item, onOpen }: { item: RecentItem; onOpen: () => void }) {
  const { data: url } = useSignedUrl(item.storage_path);
  const isVideo = item.media_type === "video";
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -3 }}
      className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-white/10"
      aria-label={item.title ?? (isVideo ? "Play video" : "View photo")}
    >
      {url ? (
        isVideo ? (
          <video
            src={`${url}#t=0.5`}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img
            src={url}
            alt={item.title ?? "Moment"}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )
      ) : (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      )}
      {isVideo && (
        <span className="glass-strong absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full">
          <Play className="h-3.5 w-3.5 text-primary" />
        </span>
      )}
    </motion.button>
  );
}

function Viewer({ item, onClose }: { item: RecentItem; onClose: () => void }) {
  const { data: url } = useSignedUrl(item.storage_path);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="glass-strong absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="max-h-full w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {url &&
          (item.media_type === "video" ? (
            <video src={url} controls autoPlay playsInline className="max-h-[80dvh] w-full rounded-2xl" />
          ) : (
            <img src={url} alt={item.title ?? "Moment"} className="max-h-[80dvh] w-full rounded-2xl object-contain" />
          ))}
        {(item.title || item.description) && (
          <div className="mt-4 text-center">
            {item.title && <p className="font-display text-2xl">{item.title}</p>}
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function RecentMedia() {
  const [open, setOpen] = useState<RecentItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["recent-media"],
    queryFn: async (): Promise<RecentItem[]> => {
      const { data, error } = await supabase
        .from("media")
        .select("id,title,description,storage_path,media_type,collection_id")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as RecentItem[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
        <ImagePlus className="h-6 w-6 text-primary" />
        <p className="font-display text-xl">Nothing here yet</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Create a collection, then upload photos and videos. Your newest moments will
          appear here so you can play or view them in one tap.
        </p>
        <Link to="/about" className="text-xs uppercase tracking-wider text-primary hover:underline">
          How Lumen works
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <Images className="h-3.5 w-3.5 text-primary" /> Recent moments
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {data.map((m) => (
          <Tile key={m.id} item={m} onOpen={() => setOpen(m)} />
        ))}
      </div>
      {open && <Viewer item={open} onClose={() => setOpen(null)} />}
    </>
  );
}
