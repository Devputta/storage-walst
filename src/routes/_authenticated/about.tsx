import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Archive, Download, EyeOff, Heart, Lock, Play, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({
    meta: [
      { title: "How Lumen Works — Private collections guide" },
      {
        name: "description",
        content: "A practical guide to Lumen collections, PIN locks, hidden mode, favorites and private media viewing.",
      },
      { property: "og:title", content: "How Lumen Works — Private collections guide" },
      {
        property: "og:description",
        content: "Learn how to organize, protect and enjoy your personal photos and videos in Lumen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const GUIDE_SECTIONS = [
  {
    icon: Archive,
    eyebrow: "01 · Organize",
    title: "Collections are your personal albums",
    body: "Use a collection for a story, occasion or mood instead of sorting through technical file names. Every collection has its own cover, title, description and item count.",
    example: "Example: “Summer Moments” can hold beach photos, sunset clips and the short videos from one trip.",
  },
  {
    icon: Lock,
    eyebrow: "02 · Protect",
    title: "A lock keeps a collection private",
    body: "Turn on a PIN from Lock settings. Until it is unlocked, the cover is blurred and the collection can use a nickname so its real title stays private.",
    example: "Example: name it “Weekend” publicly while the real collection is “Private anniversary dinner”. Forgot the PIN? Use the recovery question.",
  },
  {
    icon: EyeOff,
    eyebrow: "03 · Hide",
    title: "Hidden means away from the home screen",
    body: "Hide a collection when you want it stored but not visible in your everyday space. Hidden collections are not deleted, and you can reveal them from View options or the Hidden badge.",
    example: "Example: hide “Gift ideas” after the event, then unhide it later without re-uploading anything.",
  },
  {
    icon: Play,
    eyebrow: "04 · Enjoy",
    title: "Open an item for a cinematic view",
    body: "Tap any photo or video to open the full-screen viewer. Videos play with native controls, and the reel-style viewer lets you move one moment at a time with a swipe or arrow key.",
    example: "Example: open a vertical clip, use the video controls for sound or fullscreen, then swipe up for the next moment.",
  },
  {
    icon: Heart,
    eyebrow: "05 · Remember",
    title: "Favorites belong to each collection",
    body: "Heart the best moments inside a collection. Favorites stay connected to their collection rather than becoming a public feed. The secret Vault gathers your favorites behind its own access step.",
    example: "Example: favorite three portraits in “Family” and five clips in “Travel” — each remains connected to its original story.",
  },
  {
    icon: Download,
    eyebrow: "06 · Keep",
    title: "Download a moment or a whole collection",
    body: "Use the download control on an item for original quality or a smaller photo copy. The collection download packages its contents together so the whole story can travel with you.",
    example: "Example: choose Original (HD) for archiving, or Compressed for a quicker share-ready copy.",
  },
];

function AboutPage() {
  return (
    <AppShell>
      <section className="pt-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-primary">The Lumen guide</p>
          <h1 className="mt-3 font-display text-5xl md:text-7xl">
            Your memories,<br /><span className="text-gradient">beautifully kept.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Lumen is a private cinematic gallery for the moments you want to keep close. Here is what each part of the experience does, with simple examples.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {GUIDE_SECTIONS.map(({ icon: Icon, eyebrow, title, body, example }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 * index }}
              className="glass rounded-3xl p-6 md:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs uppercase tracking-[0.22em] text-primary">{eyebrow}</span>
                <Icon className="h-5 w-5 shrink-0 text-primary" />
              </div>
              <h2 className="mt-5 font-display text-2xl md:text-3xl">{title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
              <p className="mt-5 border-l-2 border-primary/60 pl-4 text-sm leading-6 text-foreground/80">{example}</p>
            </motion.article>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-5 glass-strong rounded-3xl p-6 md:p-8"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-4 w-4" /> A private ritual
              </p>
              <h2 className="mt-2 font-display text-2xl">The Vault is for your best moments</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Double-click the Lumen logo to discover the hidden favorites space. It is intentionally separate from your home screen, so your most meaningful moments stay personal.
              </p>
            </div>
            <div className="shrink-0 text-4xl text-primary/80">✦</div>
          </div>
        </motion.section>
      </section>
    </AppShell>
  );
}