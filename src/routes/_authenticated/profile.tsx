import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { UserRound, Database, FolderOpen, ImagePlay, Lock, EyeOff, Heart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StorageDonut } from "@/components/StorageDonut";
import { useStorageStats } from "@/lib/useStorageStats";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type CollectionInfo = {
  id: string;
  title: string;
  nickname: string | null;
  created_at: string;
  is_private: boolean;
  is_invisible: boolean;
  has_pin: boolean;
};

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Lumen" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const { totalItems, totalCollections, capacity, usedPct } = useStorageStats();
  const displayName =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Collector";

  const { data: collections } = useQuery({
    queryKey: ["profile-collections"],
    queryFn: async (): Promise<CollectionInfo[]> => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,title,nickname,created_at,is_private,is_invisible,has_pin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CollectionInfo[];
    },
  });

  const { data: favCount } = useQuery({
    queryKey: ["profile-fav-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("is_favorite", true);
      return count ?? 0;
    },
  });

  return (
    <AppShell>
      <section className="pt-10 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="glass flex h-20 w-20 items-center justify-center rounded-full text-primary">
            <UserRound className="h-9 w-9" />
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-5xl">
            {displayName}
          </h1>
          {user?.email && (
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass mx-auto mt-10 flex max-w-xl flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row sm:justify-between"
        >
          <div className="flex items-center gap-5">
            <StorageDonut usedPct={usedPct} size={88} />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vault storage</p>
              <p className="mt-1 font-display text-2xl">
                {totalItems.toLocaleString()}{" "}
                <span className="text-muted-foreground text-base">/ {capacity.toLocaleString()} items</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {totalCollections} collection{totalCollections === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-4"
        >
          {[
            { icon: FolderOpen, label: "Collections", value: totalCollections },
            { icon: ImagePlay, label: "Items", value: totalItems },
            { icon: Database, label: "Used", value: `${usedPct}%` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass flex flex-col items-center gap-1.5 rounded-3xl p-4">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-display text-xl">{value}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-6 max-w-xl"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Your collections
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3.5 w-3.5 text-primary" /> {favCount ?? 0} favorites
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {(collections ?? []).map((c) => (
              <Link
                key={c.id}
                to="/c/$id"
                params={{ id: c.id }}
                className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition hover:ring-1 hover:ring-primary/30"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-lg">
                    {c.is_private && c.nickname ? c.nickname : c.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Created{" "}
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {c.is_private && (
                    <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] uppercase tracking-wider text-primary">
                      <Lock className="h-3 w-3" /> {c.has_pin ? "PIN" : "Locked"}
                    </span>
                  )}
                  {c.is_invisible && (
                    <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] uppercase tracking-wider text-accent">
                      <EyeOff className="h-3 w-3" /> Hidden
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {collections && collections.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">No collections yet.</p>
            )}
          </div>
        </motion.div>
      </section>
    </AppShell>
  );
}
