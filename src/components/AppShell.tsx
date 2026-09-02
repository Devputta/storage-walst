import { useNavigate, Link } from "@tanstack/react-router";
import { BookOpen, Home, LogOut, Moon, Plus, Sun, UserRound } from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NewCollectionDialog } from "./NewCollectionDialog";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { to: "/app" as const, label: "Home", icon: Home },
  { to: "/about" as const, label: "About", icon: BookOpen },
];

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
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div aria-hidden className="surface-grid pointer-events-none fixed inset-0 -z-10 opacity-60" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line/80 bg-background/90 px-5 py-6 backdrop-blur-xl lg:flex">
        <Link to="/app" className="mb-10 inline-flex w-fit" aria-label="Lumen home">
          <Logo />
        </Link>
        <nav aria-label="Primary navigation" className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "bg-primary/12 text-foreground ring-1 ring-primary/20" }}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 border-t border-line/70 pt-5">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your space</p>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Private by default</p>
              <p className="truncate text-xs text-muted-foreground">Only you can access your gallery</p>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          {showNewCollection && (
            <div className="flex items-center gap-2">
              <NewCollectionDialog variant="icon" />
              <span className="text-sm text-muted-foreground">New collection</span>
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-line/70 pt-4">
            <Button asChild variant="ghost" className="min-h-11 flex-1 justify-start gap-3 px-3 text-muted-foreground hover:text-foreground">
              <Link to="/profile"><UserRound className="h-4 w-4" /> Profile</Link>
            </Button>
            <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Switch to light mode" : "Switch to dark mode"} className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground">
              {isDark ? <Sun /> : <Moon />}
            </Button>
            <Button onClick={signOut} variant="ghost" size="icon" aria-label="Sign out" title="Sign out" className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground">
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line/60 bg-background/85 backdrop-blur-xl lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <Link to="/app" aria-label="Lumen home"><Logo /></Link>
          <div className="flex items-center gap-1">
            {showNewCollection && <NewCollectionDialog variant="icon" />}
            <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} className="min-h-11 min-w-11">
              {isDark ? <Sun /> : <Moon />}
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Profile" className="min-h-11 min-w-11">
              <Link to="/profile"><UserRound /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-[1500px] px-4 pb-24 sm:px-6 lg:ml-72 lg:px-10 lg:pb-16">{children}</main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-background/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeProps={{ className: "bg-primary/12 text-foreground" }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs text-muted-foreground transition hover:text-foreground">
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}