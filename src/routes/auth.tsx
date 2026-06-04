import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Lumen" }] }),
  component: AuthPage,
});

const USERNAME_DOMAIN = "users.lumen.app";

function toEmail(input: string) {
  const v = input.trim().toLowerCase();
  if (v.includes("@")) return v;
  return `${v.replace(/[^a-z0-9_.-]/g, "")}@${USERNAME_DOMAIN}`;
}

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/app", replace: true });
  }, [session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = toEmail(identifier);
    if (!email || !email.includes("@") || email.startsWith("@")) {
      toast.error("Enter a username or email");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const displayName = identifier.includes("@")
          ? identifier.split("@")[0]
          : identifier.trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success("Account created — you're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="glass-strong w-full max-w-md rounded-3xl p-8 ring-glow"
      >
        <div className="flex justify-center"><Logo enableSecret={false} /></div>
        <h1 className="mt-6 text-center font-display text-3xl">
          {mode === "signin" ? "Welcome back" : "Create your space"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "Enter your private gallery." : "A cinematic home for your moments."}
        </p>

        <Button
          onClick={onGoogle}
          disabled={busy}
          variant="secondary"
          className="mt-8 h-11 w-full rounded-xl"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.5-1.7 4.5-5.5 4.5-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.8 14.7 3 12 3 6.9 3 2.8 7.1 2.8 12.2S6.9 21.4 12 21.4c6.9 0 9.5-4.8 9.5-9.4 0-.6-.1-1.1-.2-1.6H12z" />
          </svg>
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder={mode === "signup" ? "Choose a username" : "Username or email"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="h-11 rounded-xl bg-input/40"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-11 rounded-xl bg-input/40"
          />
          <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl text-base">
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 block w-full text-center text-sm text-muted-foreground transition hover:text-foreground"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </motion.div>
    </div>
  );
}
