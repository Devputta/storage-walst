import { useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewCollectionDialog } from "./NewCollectionDialog";
import type { ReactNode } from "react";

export function AppShell({
  children,
  search,
  onSearchChange,
  showNewCollection = false,
}: {
  children: ReactNode;
  search?: string;
  onSearchChange?: (v: string) => void;
  showNewCollection?: boolean;
}) {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Background visuals */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-accent/20 blur-[130px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-[color-mix(in_oklab,var(--aurora-2)_60%,transparent)] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklab, var(--foreground) 8%, transparent) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black, transparent 75%)",
          }}
        />
      </div>

      <header className="sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/app"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              title="Vault storage"
              className="glass flex h-10 items-center gap-2 rounded-full pl-1.5 pr-3 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <StorageDonut usedPct={usedPct} size={28} />
              <span className="hidden sm:inline">{usedPct}% used</span>
            </Link>
            <Link
              to="/profile"
              title="Profile"
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
            >
              <UserRound className="h-4 w-4" />
            </Link>
            <Button
              onClick={signOut}
              variant="ghost"
              size="icon"
              className="glass h-10 w-10 rounded-full text-primary hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-24">{children}</main>
    </div>
  );
}
