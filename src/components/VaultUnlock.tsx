import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Lock } from "lucide-react";
import { hasVaultPin, setVaultPin, verifyVaultPin } from "@/lib/vault.functions";

const SESSION_KEY = "vault_unlocked_until";
const TTL_MS = 15 * 60 * 1000;

type Ctx = {
  unlocked: boolean;
  request: (onUnlock?: () => void) => void;
  lock: () => void;
};

const VaultCtx = createContext<Ctx | null>(null);

export function VaultUnlockProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingCb, setPendingCb] = useState<(() => void) | null>(null);
  const [mode, setMode] = useState<"check" | "verify" | "setup">("check");

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const checkFn = useServerFn(hasVaultPin);
  const verifyFn = useServerFn(verifyVaultPin);
  const setFn = useServerFn(setVaultPin);

  // Restore session unlock
  useEffect(() => {
    try {
      const v = sessionStorage.getItem(SESSION_KEY);
      if (v && Number(v) > Date.now()) setUnlocked(true);
    } catch {}
  }, []);

  const markUnlocked = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, String(Date.now() + TTL_MS));
    } catch {}
    setUnlocked(true);
  }, []);

  const request = useCallback(async (cb?: () => void) => {
    if (unlocked) { cb?.(); return; }
    setPendingCb(() => cb ?? null);
    setError(""); setPin(""); setConfirmPin("");
    setOpen(true);
    setMode("check");
    setBusy(true);
    try {
      const r = await checkFn({ data: undefined as never });
      setMode(r.hasPin ? "verify" : "setup");
    } catch {
      setMode("verify");
    } finally {
      setBusy(false);
    }
  }, [unlocked, checkFn]);

  const lock = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setUnlocked(false);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (mode === "setup") {
        if (pin.length < 4) { setError("PIN must be at least 4 digits"); return; }
        if (pin !== confirmPin) { setError("PINs don't match"); return; }
        const r = await setFn({ data: { newPin: pin } });
        if (!r.ok) { setError("Couldn't save PIN"); return; }
        markUnlocked();
        setOpen(false);
        pendingCb?.();
      } else {
        const r = await verifyFn({ data: { pin } });
        if (!r.ok) { setError("Incorrect PIN"); return; }
        markUnlocked();
        setOpen(false);
        pendingCb?.();
      }
    } finally { setBusy(false); }
  };

  return (
    <VaultCtx.Provider value={{ unlocked, request, lock }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-sm rounded-3xl">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              {mode === "setup" ? <Heart className="h-6 w-6 text-primary" /> : <Lock className="h-6 w-6 text-primary" />}
            </div>
            <DialogTitle className="text-center font-display text-2xl">
              {mode === "setup" ? "Create Vault PIN" : "Vault locked"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode === "setup"
                ? "Set a PIN that protects your favorites and the Vault."
                : "Enter your Vault PIN to favorite or view favorites."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3 pt-2">
            <Input
              autoFocus
              type="password"
              inputMode="numeric"
              placeholder={mode === "setup" ? "New PIN" : "Vault PIN"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-11 rounded-xl bg-input/40 text-center text-lg tracking-[0.5em]"
            />
            {mode === "setup" && (
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="h-11 rounded-xl bg-input/40 text-center text-lg tracking-[0.5em]"
              />
            )}
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || !pin} className="h-11 w-full rounded-xl">
              {busy ? "…" : mode === "setup" ? "Save & unlock" : "Unlock"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </VaultCtx.Provider>
  );
}

export function useVaultUnlock() {
  const ctx = useContext(VaultCtx);
  if (!ctx) throw new Error("useVaultUnlock outside VaultUnlockProvider");
  return ctx;
}
