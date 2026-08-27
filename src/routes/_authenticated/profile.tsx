import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { UserRound, Database, FolderOpen, ImagePlay } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StorageDonut } from "@/components/StorageDonut";
import { useStorageStats } from "@/lib/useStorageStats";
import { useSession } from "@/lib/auth";

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
      </section>
    </AppShell>
  );
}
