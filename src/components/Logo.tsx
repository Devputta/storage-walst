import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import lumenLogo from "@/assets/lumen-logo.png.asset.json";

export function Logo({ enableSecret = true }: { enableSecret?: boolean }) {
  const navigate = useNavigate();
  const lastClick = useRef(0);

  const handleClick = () => {
    if (!enableSecret) return;
    const now = Date.now();
    if (now - lastClick.current < 350) {
      navigate({ to: "/vault" });
    }
    lastClick.current = now;
  };

  return (
    <button
      onClick={handleClick}
      className="glass group flex min-w-0 max-w-[48vw] select-none items-center justify-center rounded-[999px] px-3 py-1.5 ring-1 ring-primary/15 transition hover:ring-primary/30 sm:px-4 sm:py-2"
      aria-label="Lumen"
    >
      {/* The wordmark is used as a mask so it always picks up the app palette */}
      <span
        role="img"
        aria-label="Lumen"
        className="block h-6 w-[min(8.5rem,36vw)] transition group-hover:opacity-90 sm:h-7 sm:w-[8.5rem] md:h-8 md:w-[9rem]"
        style={{
          backgroundImage:
            "linear-gradient(100deg, color-mix(in oklab, var(--foreground) 88%, transparent), var(--primary) 45%, var(--accent) 85%)",
          WebkitMaskImage: `url(${lumenLogo.url})`,
          maskImage: `url(${lumenLogo.url})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "left center",
          maskPosition: "left center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          filter:
            "drop-shadow(0 0 14px color-mix(in oklab, var(--primary) 35%, transparent))",
        }}
      />
    </button>
  );
}
