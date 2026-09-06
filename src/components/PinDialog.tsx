import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, KeyRound } from "lucide-react";
import {
  unlockCollection,
  getRecoveryQuestion,
  recoverCollectionPin,
} from "@/lib/collections.functions";

export function PinDialog({
  open,
  collectionId,
  onUnlock,
}: {
  open: boolean;
  collectionId: string;
  onUnlock: () => void;
}) {
  const [step, setStep] = useState<"pin" | "recover">("pin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [newPin, setNewPin] = useState("");

  const unlockFn = useServerFn(unlockCollection);
  const getQ = useServerFn(getRecoveryQuestion);
  const recoverFn = useServerFn(recoverCollectionPin);
  const qc = useQueryClient();

  useEffect(() => {
    if (!open) {
      setStep("pin");
      setPin("");
      setAnswer("");
      setNewPin("");
      setError("");
    }
  }, [open]);

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length < 4) {
      setError("Use at least 4 characters for your PIN.");
      return;
    }
    setBusy(true);
    try {
      const r = await unlockFn({ data: { collectionId, pin } });
      if (r.ok) {
        setError("");
        setPin("");
        qc.invalidateQueries({ queryKey: ["media", collectionId] });
        onUnlock();
      } else {
        setError("That PIN does not match this collection.");
      }
    } catch {
      setError("We couldn't verify the PIN. Check your connection and try again.");
    } catch {
      setError("We couldn't load recovery for this collection. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const startRecovery = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await getQ({ data: { collectionId } });
      if (!r.question) {
        setError("No recovery set for this collection.");
        return;
      }
      setQuestion(r.question);
      setStep("recover");
    } finally {
      setBusy(false);
    }
  };

  const submitRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setError("Use at least 4 characters for the new PIN.");
      return;
    }
    setBusy(true);
    try {
      const r = await recoverFn({ data: { collectionId, answer, newPin } });
      if (r.ok) {
        const u = await unlockFn({ data: { collectionId, pin: newPin } });
        if (u.ok) {
          qc.invalidateQueries({ queryKey: ["media", collectionId] });
          qc.invalidateQueries({ queryKey: ["collections"] });
          onUnlock();
        } else {
          setError("PIN reset, but the collection could not be unlocked. Try the new PIN again.");
        }
      } else {
        setError("That answer does not match the recovery question.");
      }
    } catch {
      setError("We couldn't reset the PIN. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="glass-strong border-white/10 sm:max-w-sm rounded-3xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            {step === "pin" ? (
              <Lock className="h-6 w-6 text-primary" />
            ) : (
              <KeyRound className="h-6 w-6 text-primary" />
            )}
          </div>
          <DialogTitle className="text-center font-display text-2xl">
            {step === "pin" ? "Locked collection" : "Recover access"}
          </DialogTitle>
        </DialogHeader>

        {step === "pin" ? (
          <form onSubmit={submitPin} className="space-y-3 pt-2">
            <Input
              autoFocus
              type="password"
              placeholder="Enter PIN (4+ characters)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-11 rounded-xl bg-input/40 text-center text-lg tracking-[0.5em]"
            />
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || !pin} className="h-11 w-full rounded-xl">
              {busy ? "Unlocking…" : "Unlock"}
            </Button>
            <button
              type="button"
              onClick={startRecovery}
              disabled={busy}
              className="block w-full text-center text-xs text-muted-foreground transition hover:text-foreground"
            >
              Forgot PIN?
            </button>
          </form>
        ) : (
          <form onSubmit={submitRecovery} className="space-y-3 pt-2">
            <p className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm">{question}</p>
            <Input
              autoFocus
              placeholder="Your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="h-11 rounded-xl bg-input/40"
            />
            <Input
              type="password"
              placeholder="Choose a new PIN (4+ characters)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="h-11 rounded-xl bg-input/40 text-center tracking-[0.4em]"
            />
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || !answer || !newPin} className="h-11 w-full rounded-xl">
              {busy ? "Resetting…" : "Reset PIN & unlock"}
            </Button>
            <button
              type="button"
              onClick={() => { setStep("pin"); setError(""); }}
              className="block w-full text-center text-xs text-muted-foreground transition hover:text-foreground"
            >
              Back to PIN
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
