import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Heart } from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="glass rounded-full px-4 py-2">
            <Link to="/app"><Logo /></Link>
          </div>
          <div className="glass flex items-center gap-1 rounded-full px-2 py-1">
            <Link
              to="/vault"
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground hover:bg-white/5 inline-flex items-center gap-1.5"
            >
              <Heart className="h-4 w-4" /> Favorites
            </Link>
            <Button onClick={signOut} variant="ghost" size="sm" className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-24">{children}</main>
    </div>
  );
}
