import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useSignedUrl } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({ meta: [{ title: "Vault — Lumen" }] }),
  component: VaultPage,
});

type Fav = { id: string; storage_path: string; media_type: "image" | "video"; title: string | null };

function VaultPage() {
  const { data } = useQuery({
    queryKey: ["favorites"],
    queryFn: async (): Promise<Fav[]> => {
      const { data, error } = await supabase
        .from("media")
        .select("id,storage_path,media_type,title")
        .eq("is_favorite", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Fav[];
    },
  });

  return (
    <AppShell>
      <section className="pt-8 pb-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-primary" /> The Vault
          </p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">
            Your <span className="text-gradient">favorites</span>.
          </h1>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Hidden moments — only you know this door exists.
          </p>
        </motion.div>
      </section>

      {data && data.length > 0 ? (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
          {data.map((m) => <VaultTile key={m.id} m={m} />)}
        </div>
      ) : (
        <div className="glass mt-12 rounded-3xl py-24 text-center text-muted-foreground">
          <p>No favorites yet. Heart something to find it here.</p>
        </div>
      )}
    </AppShell>
  );
}

function VaultTile({ m }: { m: Fav }) {
  const { data: url } = useSignedUrl(m.storage_path);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-white/5"
    >
      {url ? (
        m.media_type === "image" ? (
          <img src={url} className="w-full" alt={m.title ?? ""} loading="lazy" />
        ) : (
          <video src={url} className="w-full" muted playsInline preload="metadata" />
        )
      ) : (
        <div className="aspect-[3/4] animate-pulse bg-white/5" />
      )}
    </motion.div>
  );
}
