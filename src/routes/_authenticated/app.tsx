import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Eye, EyeOff, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { CollectionCard, type CollectionCardData } from "@/components/CollectionCard";
import { NewCollectionDialog } from "@/components/NewCollectionDialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Your Space — Lumen" }] }),
  component: AppPage,
});

type Row = {
  id: string;
  title: string;
  nickname: string | null;
  cover_url: string | null;
  is_private: boolean;
  is_invisible: boolean;
  has_pin: boolean;
};

function AppPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});

  const deleteCollection = async (cid: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its photos & videos? This cannot be undone.`)) return;
    try {
      const { data: items } = await supabase
        .from("media")
        .select("id,storage_path")
        .eq("collection_id", cid)
        .range(0, 1049);
      const paths = (items ?? []).map((i) => i.storage_path).filter(Boolean);
      if (paths.length) {
        // Storage.remove handles batches; chunk to be safe
        for (let i = 0; i < paths.length; i += 100) {
          await supabase.storage.from("media").remove(paths.slice(i, i + 100));
        }
      }
      await supabase.from("media").delete().eq("collection_id", cid);
      await supabase.from("collections").delete().eq("id", cid);
      toast.success("Collection deleted");
      qc.invalidateQueries({ queryKey: ["collections"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const unhideCollection = async (cid: string) => {
    const { error } = await supabase
      .from("collections")
      .update({ is_invisible: false })
      .eq("id", cid);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Moved back to your home page");
    qc.invalidateQueries({ queryKey: ["collections"] });
  };




  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,title,nickname,cover_url,is_private,is_invisible,has_pin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["collection-counts", (data ?? []).map((c) => c.id).join(",")],
    enabled: !!data && data.length > 0,
    queryFn: async (): Promise<Record<string, number>> => {
      const ids = (data ?? []).map((c) => c.id);
      const entries = await Promise.all(
        ids.map(async (id) => {
          const { count } = await supabase
            .from("media")
            .select("id", { count: "exact", head: true })
            .eq("collection_id", id);
          return [id, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    return list.filter((c) => {
      if (c.is_invisible && !showHidden && !search) return false;
      if (c.is_private && !showLocked && !search) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, search, showHidden, showLocked]);

  const hiddenCount = useMemo(
    () => (data ?? []).filter((c) => c.is_invisible).length,
    [data],
  );

  const lockedCount = useMemo(
    () => (data ?? []).filter((c) => c.is_private).length,
    [data],
  );

  return (
    <AppShell search={search} onSearchChange={setSearch} showNewCollection>
      <section className="pt-8 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Your Space</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">
            Welcome <span className="text-gradient">back</span>.
          </h1>
          <p className="mt-3 max-w-lg text-muted-foreground">
            A cinematic home for every photograph and frame.
          </p>
        </motion.div>

        {/* Cloud-style storage summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass mt-8 flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) ${usedPct}%, color-mix(in oklab, var(--card) 80%, transparent) ${usedPct}% 100%)`,
                }}
              />
              <div className="absolute inset-[6px] rounded-full bg-card/90 backdrop-blur flex flex-col items-center justify-center">
                <span className="font-display text-lg leading-none">{usedPct}%</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">used</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vault storage</p>
              <p className="mt-1 font-display text-2xl">
                {totalItems.toLocaleString()} <span className="text-muted-foreground text-base">/ {capacity.toLocaleString()} items</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {totalCollections} collection{totalCollections === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex items-center gap-2">
          <div
            className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-muted-foreground"
            title="Each collection has its own favorites — tap the heart on any photo or video."
          >
            <Heart className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Favorites live inside each collection</span>
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs transition hover:text-foreground"
              aria-pressed={showHidden}
            >
              {showHidden ? <EyeOff className="h-3.5 w-3.5 text-accent" /> : <Eye className="h-3.5 w-3.5 text-accent" />}
              {showHidden ? `Hiding ${hiddenCount}` : `Show hidden (${hiddenCount})`}
            </button>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <div className="glass flex w-full max-w-sm items-center gap-2 rounded-full px-5 py-3">
            <Input
              placeholder="Search anything here"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

      </section>


      <section>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4"
          >
            <NewCollectionDialog />
            {filtered.map((c) => {
              const card: CollectionCardData = { ...c, count: counts?.[c.id] };
              const locked = !!(c.is_private && c.has_pin && !unlocked[c.id]);
              return (
                <div key={c.id} onClick={() => locked && setUnlocked((u) => ({ ...u, [c.id]: false }))}>
                  <CollectionCard
                    c={card}
                    locked={locked}
                    onDelete={() => deleteCollection(c.id, c.title)}
                    onUnhide={c.is_invisible ? () => unhideCollection(c.id) : undefined}
                  />

                </div>
              );
            })}
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            {search ? "No collections match your search." : "Create your first collection above."}
          </p>
        )}
      </section>
    </AppShell>
  );
}
