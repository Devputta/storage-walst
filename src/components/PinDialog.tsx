import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { unlockCollection } from "@/lib/collections.functions";

export function PinDialog({
  open,
  collectionId,
  onUnlock,
}: {
  open: boolean;
  collectionId: string;
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const unlockFn = useServerFn(unlockCollection);
  const qc = useQueryClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await unlockFn({ data: { collectionId, pin } });
      if (r.ok) {
        setError("");
        setPin("");
        qc.invalidateQueries({ queryKey: ["media", collectionId] });
        onUnlock();
      } else {
        setError("Incorrect PIN");
      }
    } catch {
      setError("Unable to verify PIN");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-sm rounded-3xl [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-2xl">Locked collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 pt-2">
          <Input
            autoFocus
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="h-11 rounded-xl bg-input/40 text-center text-lg tracking-[0.5em]"
          />
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || !pin} className="h-11 w-full rounded-xl">
            {busy ? "Unlocking…" : "Unlock"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
