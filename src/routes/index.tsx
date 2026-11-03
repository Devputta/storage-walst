import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Logo } from "@/components/Logo";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — A private archive for your frames" },
      { name: "description", content: "A private, quiet space for your photos and videos. Collections, locked moments, and a vault only you can open." },
      { property: "og:title", content: "Lumen — A private archive for your frames" },
      { property: "og:description", content: "A private, quiet space for your photos and videos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

const NOTES = [
  { label: "01", title: "Cinematic gallery", text: "Fullscreen viewing, ultra-HD zoom, smooth swipe." },
  { label: "02", title: "Locked collections", text: "PIN-protected vaults with blurred previews." },
  { label: "03", title: "Secret gestures", text: "Double-tap the logo to reveal hidden spaces." },
];

function Landing() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app" });
  }, [session, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-border/60 px-6 py-5">
        <Logo enableSecret={false} />
        <Button asChild variant="secondary" className="h-9 px-4 text-sm">
          <a href="/auth">Sign in</a>
        </Button>
      </div>

      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground"
        >
          Private archive · est. 2026
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-6 font-display text-5xl leading-[1.1] md:text-7xl"
        >
          Your memories,<br />
          <span className="text-gradient">kept in order.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-8 max-w-xl text-lg text-muted-foreground"
        >
          A private space for photos and videos. Quiet collections,
          locked moments, and a vault only you can open.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-10 flex items-center gap-3"
        >
          <Button asChild size="lg" className="h-12 px-7 text-base font-medium">
            <a href="/auth">
              Enter your archive <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="mx-auto max-w-6xl px-6 pb-24"
      >
        <div className="border-t border-border/60">
          {NOTES.map((f) => (
            <div key={f.label} className="flex flex-col gap-2 border-b border-border/60 py-6 md:flex-row md:items-baseline md:gap-10">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:w-16">{f.label}</span>
              <h3 className="font-display text-xl md:w-64">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
