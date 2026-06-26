import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  changeCollectionPin,
  setCollectionPin,
  setRecoveryQuestion,
} from "@/lib/collections.functions";
import { toast } from "sonner";

export function CollectionSettingsDialog({
  collectionId,
  currentNickname,
  hasPin,
}: {
  collectionId: string;
  currentNickname: string | null;
  hasPin: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(currentNickname ?? "");
  const [curPin, setCurPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [rq, setRq] = useState("");
  const [ra, setRa] = useState("");
  const [busy, setBusy] = useState(false);
  const changePin = useServerFn(changeCollectionPin);
  const setPinFn = useServerFn(setCollectionPin);
  const setRecovery = useServerFn(setRecoveryQuestion);

  const saveNickname = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("collections")
      .update({ nickname: nickname.trim() || null })
      .eq("id", collectionId);
    setBusy(false);
    if (error) return toast.error("Failed to save nickname");
    toast.success("Nickname updated");
    qc.invalidateQueries({ queryKey: ["collections"] });
    qc.invalidateQueries({ queryKey: ["collection", collectionId] });
  };

  const doChangePin = async () => {
    if (!curPin || !newPin) return;
    setBusy(true);
    const r = await changePin({
      data: { collectionId, currentPin: curPin, newPin },
    });
    setBusy(false);
    if (!r.ok) return toast.error("Current PIN is wrong");
    toast.success("PIN changed");
    setCurPin(""); setNewPin("");
  };

  const doSetPin = async () => {
    if (!newPin) return;
    setBusy(true);
    const r = await setPinFn({ data: { collectionId, newPin } });
    setBusy(false);
    if (!r.ok) return toast.error("Failed to set PIN");
    toast.success("Lock enabled");
    setNewPin("");
    qc.invalidateQueries({ queryKey: ["collection", collectionId] });
    qc.invalidateQueries({ queryKey: ["collections"] });
  };

  const doSaveRecovery = async () => {
    if (!rq.trim() || !ra.trim()) return;
    setBusy(true);
    const r = await setRecovery({
      data: { collectionId, question: rq.trim(), answer: ra.trim() },
    });
    setBusy(false);
    if (!r.ok) return toast.error("Failed to save");
    toast.success("Recovery saved");
    setRq(""); setRa("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-full">
          <Lock className="mr-1.5 h-4 w-4" /> {hasPin ? "Lock" : "Set PIN"}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Lock settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label>Nickname</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Shown when locked"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="h-11 rounded-xl bg-input/40"
              />
              <Button onClick={saveNickname} disabled={busy} className="h-11 rounded-xl">
                Save
              </Button>
            </div>
          </div>

          {hasPin && (
            <>
              <div className="space-y-2 rounded-xl bg-white/[0.03] p-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Change PIN
                </Label>
                <Input
                  type="password"
                  placeholder="Current PIN"
                  value={curPin}
                  onChange={(e) => setCurPin(e.target.value)}
                  className="h-11 rounded-xl bg-input/40"
                />
                <Input
                  type="password"
                  placeholder="New PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="h-11 rounded-xl bg-input/40"
                />
                <Button
                  onClick={doChangePin}
                  disabled={busy || !curPin || !newPin}
                  className="h-10 w-full rounded-xl"
                >
                  Update PIN
                </Button>
              </div>

              <div className="space-y-2 rounded-xl bg-white/[0.03] p-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Set / update recovery
                </Label>
                <Input
                  placeholder="Recovery question"
                  value={rq}
                  onChange={(e) => setRq(e.target.value)}
                  className="h-11 rounded-xl bg-input/40"
                />
                <Input
                  placeholder="Answer"
                  value={ra}
                  onChange={(e) => setRa(e.target.value)}
                  className="h-11 rounded-xl bg-input/40"
                />
                <Button
                  onClick={doSaveRecovery}
                  disabled={busy || !rq.trim() || !ra.trim()}
                  variant="secondary"
                  className="h-10 w-full rounded-xl"
                >
                  Save recovery
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
