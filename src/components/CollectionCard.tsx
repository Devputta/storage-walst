import { Link } from "@tanstack/react-router";
import { Lock, Eye, EyeOff, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useSignedUrl } from "@/lib/storage";

export type CollectionCardData = {
  id: string;
  title: string;
  nickname?: string | null;
  cover_url: string | null;
  is_private: boolean;
  is_invisible: boolean;
  count?: number;
};

export function CollectionCard({
  c,
  locked,
  onDelete,
  onUnhide,
}: {
  c: CollectionCardData;
  locked: boolean;
  onDelete?: () => void;
  onUnhide?: () => void;
}) {
  const { data: coverUrl } = useSignedUrl(c.cover_url, !locked);
  const displayTitle = locked && c.nickname ? c.nickname : c.title;
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative"
    >
      <Link
        to="/c/$id"
        params={{ id: c.id }}
        aria-label={displayTitle}
        className="group relative block aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/10"
      >
         {coverUrl && !locked ? (
          <img
            src={coverUrl}
            alt={c.title}
            className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
              locked ? "blur-2xl scale-110" : ""
            }`}
          />
         ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-card to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass-strong flex h-16 w-16 items-center justify-center rounded-full">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
        )}

        <div className="absolute left-4 right-14 top-4 flex items-start justify-between gap-2">
          {c.is_private && (
            <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary">
              <Lock className="h-3 w-3" /> Private
            </span>
          )}
          {c.is_invisible && (
            <span
              role={onUnhide ? "button" : undefined}
              tabIndex={onUnhide ? 0 : undefined}
              title={onUnhide ? "Unhide — show on home page" : undefined}
              onClick={(e) => {
                if (!onUnhide) return;
                e.preventDefault();
                e.stopPropagation();
                onUnhide();
              }}
              className={`glass z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider text-accent ml-auto ${
                onUnhide ? "cursor-pointer hover:text-foreground" : ""
              }`}
            >
              <EyeOff className="h-3 w-3" /> Hidden
              {onUnhide && <Eye className="h-3 w-3 opacity-70" />}
            </span>
          )}
        </div>


        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-display text-2xl leading-tight text-white">{displayTitle}</h3>
          {typeof c.count === "number" && (
            <p className="mt-1 text-xs text-white/60">{c.count} items</p>
          )}
        </div>
      </Link>

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete collection"
          className="glass-strong absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full hover:bg-destructive/40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

