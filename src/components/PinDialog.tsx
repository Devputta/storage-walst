import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { sha256 } from "@/lib/auth";

export function PinDialog({
  open,
  expectedHash,
  onUnlock,
}: {
  open: boolean;
  expectedHash: string;
  onUnlock: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = await sha256(pin);
    if (h === expectedHash) {
      setError(""); setPin(""); onUnlock();
    } else {
      setError("Incorrect PIN");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-sm rounded-3xl" hideClose>
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
          <Button type="submit" className="h-11 w-full rounded-xl">Unlock</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
