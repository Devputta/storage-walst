import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Lock, EyeOff, Heart, Images, Sparkles, Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({
    meta: [
      { title: "About Lumen — How your private gallery works" },
      {
        name: "description",
        content:
          "Learn how Lumen collections, locks, hidden mode, favorites and the secret vault keep your photos and videos private.",
      },
      { property: "og:title", content: "About Lumen — How your private gallery works" },
      {
        property: "og:description",
        content: "Collections, PIN locks, hidden mode, favorites and the secret vault explained.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const FEATURES = [
  {
    icon: Images,
    title: "Collections, not folders",
    body: "Group memories like playlists — a cover, a title and an optional description. Each collection holds up to 1050 items.",
  },
  {
    icon: Lock,
    title: "Lock with a PIN",
    body: "Locked collections blur their cover and show a nickname instead of the real title until you unlock them.",
  },
  {
    icon: EyeOff,
    title: "Hidden mode",
    body: "Hidden collections disappear from your home page. Reveal them from the menu, and tap the Hidden badge to bring one back.",
  },
  {
    icon: Heart,
    title: "Favorites per collection",
    body: "Every collection keeps its own favorites — tap the heart on any photo or video inside it.",
  },
  {
    icon: Sparkles,
    title: "Secret vault",
    body: "Double-click the logo anywhere in the app to slip into your vault — a private feed only you know about.",
  },
  {
    icon: Download,
    title: "Download anything",
    body: "Save a single item in original or compressed quality, or zip an entire collection in one tap.",
  },
];

function AboutPage() {
  return (
    <AppShell>
      <section className="pt-10 pb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Guide</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">
            About <span className="text-gradient">Lumen</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            A cinematic, private home for your photos and videos. Here's everything it can do.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="glass rounded-3xl p-5"
            >
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-display text-xl">{title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
