export function StorageDonut({ usedPct, size = 40 }: { usedPct: number; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--primary) ${usedPct}%, color-mix(in oklab, var(--card) 80%, transparent) ${usedPct}% 100%)`,
        }}
      />
      <div className="absolute inset-[4px] rounded-full bg-card/90 backdrop-blur flex items-center justify-center">
        <span className="font-display text-[10px] leading-none">{usedPct}%</span>
      </div>
    </div>
  );
}
