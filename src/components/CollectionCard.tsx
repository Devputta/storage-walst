import { Link } from "@tanstack/react-router";
import { Lock, Eye } from "lucide-react";
import { motion } from "motion/react";
import { useSignedUrl } from "@/lib/storage";

export type CollectionCardData = {
  id: string;
  title: string;
  cover_url: string | null;
  is_private: boolean;
  is_invisible: boolean;
  count?: number;
};

export function CollectionCard({ c, locked }: { c: CollectionCardData; locked: boolean }) {
  const { data: coverUrl } = useSignedUrl(c.cover_url);
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Link
        to="/c/$id"
        params={{ id: c.id }}
        className="group relative block aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/10"
      >
        {coverUrl ? (
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

        <div className="absolute left-4 right-4 top-4 flex justify-between">
          {c.is_private && (
            <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary">
              <Lock className="h-3 w-3" /> Private
            </span>
          )}
          {c.is_invisible && (
            <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider text-accent ml-auto">
              <Eye className="h-3 w-3" /> Hidden
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-display text-2xl leading-tight text-white">{c.title}</h3>
          {typeof c.count === "number" && (
            <p className="mt-1 text-xs text-white/60">{c.count} items</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
