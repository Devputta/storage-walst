import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import lumenMark from "@/assets/lumen-mark.png";

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
      className="glass group flex min-w-0 select-none items-center gap-2 rounded-[999px] py-1.5 pl-1.5 pr-4 ring-1 ring-primary/15 transition hover:ring-primary/30"
      aria-label="Lumen"
    >
      <img
        src={lumenMark}
        alt="Lumen aperture logo"
        width={512}
        height={512}
        className="h-8 w-8 rounded-full object-contain drop-shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_45%,transparent)] transition group-hover:rotate-45 group-hover:duration-500 sm:h-9 sm:w-9"
      />
      <span className="font-display text-base font-semibold tracking-[0.25em] text-gradient sm:text-lg">
        LUMEN
      </span>
    </button>
  );
}
