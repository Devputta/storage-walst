import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Heart, Lock, SlidersHorizontal, ChevronDown, Info, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { CollectionCard, type CollectionCardData } from "@/components/CollectionCard";
import { RecentMedia } from "@/components/RecentMedia";
import { Input } from "@/components/ui/input";
import { useWebMCP } from "use-webmcp-tool";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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

type RecentCollection = { id: string; visitedAt: number };

const RECENT_KEY = "lumen.recentCollections";

function AppPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [recentIds, setRecentIds] = useState<RecentCollection[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as RecentCollection[];
      setRecentIds(Array.isArray(saved) ? saved.filter((item) => typeof item?.id === "string") : []);
    } catch {
      setRecentIds([]);
    }
  }, []);

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

  const { data, isLoading, error } = useQuery({
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
      if (search) {
        const query = search.toLowerCase();
        if (!c.title.toLowerCase().includes(query) && !(c.nickname ?? "").toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [data, search, showHidden, showLocked]);

  useWebMCP({
    name: "list_visible_collections",
    description: "List the collections currently shown on the gallery screen, respecting search and filters.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () =>
      runWebMCPTool("list_visible_collections", () => {
        if (isLoading) return "Collections are still loading.";
        if (filtered.length === 0) return "No collections shown.";
        return filtered.map((c) => `${c.id}: ${c.is_private ? "[locked] " : ""}${c.title}`).join("\n");
      }),
  });

  useWebMCP({
    name: "filter_collections",
    description: "Change the gallery view: search text, and whether hidden or locked collections are shown.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search text for title or nickname; empty string clears it." },
        show_hidden: { type: "boolean", description: "Show hidden collections." },
        show_locked: { type: "boolean", description: "Show locked collections." },
      },
    },
    execute: (args: { search?: unknown; show_hidden?: unknown; show_locked?: unknown }) =>
      runWebMCPTool("filter_collections", () => {
        if (args.search !== undefined && typeof args.search !== "string") throw new Error("search must be text.");
        if (args.show_hidden !== undefined && typeof args.show_hidden !== "boolean") throw new Error("show_hidden must be true or false.");
        if (args.show_locked !== undefined && typeof args.show_locked !== "boolean") throw new Error("show_locked must be true or false.");
        if (args.search !== undefined) setSearch(args.search as string);
        if (args.show_hidden !== undefined) setShowHidden(args.show_hidden as boolean);
        if (args.show_locked !== undefined) setShowLocked(args.show_locked as boolean);
        return "Gallery view updated.";
      }),
  });

  const hiddenCount = useMemo(
    () => (data ?? []).filter((c) => c.is_invisible).length,
    [data],
  );

  const lockedCount = useMemo(
    () => (data ?? []).filter((c) => c.is_private).length,
    [data],
  );

  const recent = useMemo(() => {
    const byId = new Map((data ?? []).map((item) => [item.id, item]));
    return recentIds
      .map((item) => ({ collection: byId.get(item.id), visitedAt: item.visitedAt }))
      .filter((item): item is { collection: Row; visitedAt: number } => !!item.collection)
      .slice(0, 4);
  }, [data, recentIds]);

  return (
    <AppShell showNewCollection>
      {/* Archive masthead — asymmetric, typographic, no hero card */}
      <header className="border-b border-line pb-10 pt-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-primary">
              Private archive
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.08] md:text-6xl">
              Your archive, kept in order.
            </h1>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:pb-2 md:text-right">
            {data?.length ?? 0} collections · {lockedCount} locked · {hiddenCount} hidden
          </p>
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-input px-3 sm:w-72">
            <Search aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              aria-label="Search collections"
              placeholder="Search the index"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-input px-4 text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                View
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-lg">
              <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em]">Show in your space</DropdownMenuLabel>
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
                  {showHidden ? <EyeOff className="h-3.5 w-3.5 text-accent" /> : <Eye className="h-3.5 w-3.5 text-accent" />}
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
      </header>

      <section className="pb-12 pt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl">Latest frames</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Newest first</p>
        </div>
        <RecentMedia />
      </section>

      {recent.length > 0 && (
        <section className="border-t border-line py-10" aria-labelledby="recent-collections-heading">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-xl">Recently viewed</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Last opened</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map(({ collection: c }) => {
              const locked = !!(c.is_private && c.has_pin && !unlocked[c.id]);
              return (
                <Link
                  key={c.id}
                  to="/c/$id"
                  params={{ id: c.id }}
                  className="group flex min-w-0 flex-col justify-between gap-4 border border-line px-4 py-4 transition hover:border-foreground/30"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-display text-base leading-snug">
                      {locked && c.nickname ? c.nickname : c.title}
                    </span>
                    <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {locked ? "PIN protected" : "Ready to open"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {locked ? <Lock className="h-3.5 w-3.5 text-primary" /> : <Eye className="h-3.5 w-3.5 text-accent" />}
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className={recent.length > 0 ? "border-t border-line py-10" : "border-t border-line py-10"}>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl">The index</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {filtered.length} shown
          </p>
        </div>

        {isLoading ? (
          <div aria-label="Loading collections" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse border border-line bg-muted/60" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="flex flex-col items-start justify-center border border-line px-6 py-14 text-center sm:items-center">
            <p className="font-display text-2xl">Your collections could not load</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">Check your connection and try again. Nothing in your gallery was changed.</p>
            <Button variant="secondary" className="mt-6 rounded-lg border border-input" onClick={() => qc.invalidateQueries({ queryKey: ["collections"] })}>Try again</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="mt-2 flex flex-col items-start border border-dashed border-line px-6 py-16 sm:items-center sm:text-center">
            <p className="font-display text-2xl">{search ? "Nothing in the index matches" : "The archive is empty"}</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {search ? "Try another search or clear the filter." : "Create a collection to keep your photos and videos together."}
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
