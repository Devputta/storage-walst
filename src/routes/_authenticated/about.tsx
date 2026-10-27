import { createFileRoute } from "@tanstack/react-router";
import { Archive, Download, EyeOff, Heart, Lock, Play } from "lucide-react";
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
      <header className="border-b border-line pb-10 pt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-primary">The Lumen guide</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] md:text-6xl">
          A private archive, kept with care.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
          Lumen is a private gallery for the moments you want to keep close. Here is what each part of the experience does, with simple examples.
        </p>
      </header>

      <section className="py-4">
        {GUIDE_SECTIONS.map(({ icon: Icon, eyebrow, title, body, example }) => (
          <article
            key={title}
            className="grid gap-5 border-b border-line py-9 md:grid-cols-[10rem_2rem_1fr] md:gap-8"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary md:pt-1.5">{eyebrow}</p>
            <Icon className="hidden h-4 w-4 text-muted-foreground md:mt-1.5 md:block" aria-hidden />
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl leading-snug">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
              <p className="mt-4 border-l-2 border-accent/60 pl-4 font-mono text-[11px] uppercase leading-6 tracking-[0.08em] text-muted-foreground">{example}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="border border-line p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">A private ritual</p>
            <h2 className="mt-2 font-display text-2xl">The Vault is for your best moments</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Double-click the Lumen logo to discover the hidden favorites space. It is intentionally separate from your home screen, so your most meaningful moments stay personal.
            </p>
          </div>
          <p className="shrink-0 font-mono text-3xl text-primary/70">✦</p>
        </div>
      </section>
    </AppShell>
  );
}
