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
      className="group flex items-center select-none"
      aria-label="Lumen"
    >
      {/* The wordmark is used as a mask so it always picks up the app palette */}
      <span
        role="img"
        aria-label="Lumen"
        className="block h-8 w-[8.5rem] transition group-hover:opacity-90 md:h-9 md:w-[10rem]"
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
