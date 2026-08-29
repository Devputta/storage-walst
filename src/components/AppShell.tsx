import { useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound, Moon, Sun } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NewCollectionDialog } from "./NewCollectionDialog";
import { useEffect, useState, type ReactNode } from "react";

export function AppShell({
  children,
  showNewCollection = false,
}: {
  children: ReactNode;
  showNewCollection?: boolean;
}) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("lumen-theme");
    const shouldUseDark = savedTheme !== "light";
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    window.localStorage.setItem("lumen-theme", nextIsDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", nextIsDark);
  };

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
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:flex sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/app"><Logo /></Link>
            <nav className="hidden items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground sm:flex">
              <Link
                to="/app"
                activeProps={{ className: "text-foreground" }}
                className="rounded-full px-3 py-1.5 transition hover:text-foreground"
              >
                Home
              </Link>
              <Link
                to="/about"
                activeProps={{ className: "text-foreground" }}
                className="rounded-full px-3 py-1.5 transition hover:text-foreground"
              >
                About
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {showNewCollection && <NewCollectionDialog variant="icon" />}
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="glass min-h-10 min-w-10 rounded-full text-primary hover:text-primary"
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>
            <Link
              to="/profile"
              title="Profile"
              aria-label="Profile"
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
            >
              <UserRound className="h-4 w-4" />
            </Link>
            <Button
              onClick={signOut}
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              title="Sign out"
              className="glass min-h-10 min-w-10 rounded-full text-primary hover:text-primary"
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
