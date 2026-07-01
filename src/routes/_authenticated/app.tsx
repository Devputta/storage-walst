import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
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
      if (c.is_invisible && !search) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, search]);

  return (
    <AppShell>
      <section className="pt-8 pb-12">
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

        <div className="mt-8 max-w-md">
          <div className="glass flex items-center gap-2 rounded-full px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
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
              const card: CollectionCardData = c;
              const locked = !!(c.is_private && c.has_pin && !unlocked[c.id]);
              return (
                <div key={c.id} onClick={() => locked && setUnlocked((u) => ({ ...u, [c.id]: false }))}>
                  <CollectionCard c={card} locked={locked} onDelete={() => deleteCollection(c.id, c.title)} />
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
