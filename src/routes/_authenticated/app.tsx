import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Heart, Lock, SlidersHorizontal, ChevronDown, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { CollectionCard, type CollectionCardData } from "@/components/CollectionCard";
import { RecentMedia } from "@/components/RecentMedia";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
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
  const [showLocked, setShowLocked] = useState(false);
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
      if (c.is_invisible && !showHidden) return false;
      if (c.is_private && !showLocked) return false;
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
    <AppShell showNewCollection>
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

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex">
          <div className="glass flex min-w-0 h-10 items-center gap-2 rounded-full px-4 sm:w-64">
            <Input
              aria-label="Search collections"
              placeholder="Search collections"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            />
            <span aria-hidden className="shrink-0 text-xs text-muted-foreground">⌕</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs transition hover:text-foreground"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                View options
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-2xl">
              <DropdownMenuLabel>Show in your space</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={showLocked}
                onCheckedChange={(v) => setShowLocked(!!v)}
                disabled={lockedCount === 0}
              >
                <span className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary" /> Locked ({lockedCount})
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showHidden}
                onCheckedChange={(v) => setShowHidden(!!v)}
                disabled={hiddenCount === 0}
              >
                <span className="flex items-center gap-2">
                  {showHidden ? (
                    <EyeOff className="h-3.5 w-3.5 text-accent" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-accent" />
                  )}
                  Hidden ({hiddenCount})
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/about" className="cursor-pointer">
                  <Info className="mr-2 h-3.5 w-3.5 text-primary" /> How Lumen works
                </Link>
              </DropdownMenuItem>
              <DropdownMenuLabel className="flex items-start gap-2 pt-2 text-[11px] font-normal text-muted-foreground">
                <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Favorites live inside each collection — tap the heart on any photo or video.
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <section className="pb-10">
        <RecentMedia />
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
