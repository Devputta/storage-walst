import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

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
      className="group flex items-center gap-2.5 select-none"
      aria-label="Lumen"
    >
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent ring-glow">
        <span className="absolute inset-[3px] rounded-full bg-background/70 backdrop-blur" />
        <span className="relative font-display text-base font-semibold text-gradient">L</span>
      </span>
      <span className="font-display text-xl tracking-tight">
        Lumen<span className="text-muted-foreground">.</span>
      </span>
    </button>
  );
}
