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
      <img
        src={lumenLogo.url}
        alt="Lumen"
        className="h-8 w-auto object-contain mix-blend-screen drop-shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_45%,transparent)] transition group-hover:scale-[1.03] group-hover:opacity-95 md:h-9"
      />
    </button>
  );
}
