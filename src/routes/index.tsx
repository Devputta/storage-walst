import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Logo } from "@/components/Logo";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Sparkles, Film } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Your private cinematic gallery" },
      { name: "description", content: "A premium private space for your photos and videos. Cinematic gallery, locked collections, secret moments." },
      { property: "og:title", content: "Lumen — Your private cinematic gallery" },
      { property: "og:description", content: "A premium private space for your photos and videos." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app" });
  }, [session, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo enableSecret={false} />
        <Button asChild variant="ghost" className="rounded-full">
          <a href="/auth">Sign in</a>
        </Button>
      </div>

      <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-muted-foreground"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Private by design
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-6 font-display text-6xl leading-[1.05] md:text-8xl"
        >
          Your memories,<br />
          <span className="text-gradient">staged like cinema.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground"
        >
          A premium private space for photos and videos. Beautiful collections,
          locked moments, and a vault only you can see.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-12 flex items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="rounded-full h-12 px-7 text-base font-medium">
            <a href="/auth">
              Enter your space <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-24 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {[
            { icon: Film, title: "Cinematic gallery", text: "Fullscreen viewing, ultra-HD zoom, smooth swipe." },
            { icon: Lock, title: "Locked collections", text: "PIN-protected vaults with blurred previews." },
            { icon: Sparkles, title: "Secret gestures", text: "Double-tap the logo to reveal hidden spaces." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 text-left">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
