import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sha256 } from "@/lib/auth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function NewCollectionDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [nickname, setNickname] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isInvisible, setIsInvisible] = useState(false);
  const [pin, setPin] = useState("");
  const [recoveryQ, setRecoveryQ] = useState("");
  const [recoveryA, setRecoveryA] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setTitle(""); setNickname(""); setIsPrivate(false); setIsInvisible(false);
    setPin(""); setRecoveryQ(""); setRecoveryA("");
  };

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const pin_hash = isPrivate && pin ? await sha256(pin) : null;
      const recovery_answer_hash =
        isPrivate && recoveryQ.trim() && recoveryA.trim()
          ? await sha256(recoveryA.trim().toLowerCase())
          : null;
      const { error } = await supabase.from("collections").insert({
        user_id: u.user.id,
        title: title.trim(),
        nickname: nickname.trim() || null,
        is_private: isPrivate,
        is_invisible: isInvisible,
        pin_hash,
        recovery_question: isPrivate && recoveryQ.trim() ? recoveryQ.trim() : null,
        recovery_answer_hash,
      });
      if (error) throw error;
      toast.success("Collection created");
      qc.invalidateQueries({ queryKey: ["collections"] });
      reset(); setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="group relative aspect-[4/5] rounded-3xl border border-dashed border-white/15 bg-white/[0.02] transition hover:border-primary/40 hover:bg-white/[0.04]">
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="glass flex h-14 w-14 items-center justify-center rounded-full transition group-hover:scale-110">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display text-lg">New collection</span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              autoFocus
              placeholder="Summer Moments"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-xl bg-input/40"
            />
          </div>
          <div className="space-y-2">
            <Label>Nickname <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              placeholder="Shown instead of the real name when locked"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-11 rounded-xl bg-input/40"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <div>
              <Label className="cursor-pointer">Lock with PIN</Label>
              <p className="text-xs text-muted-foreground">Blur previews until unlocked.</p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
          {isPrivate && (
            <div className="space-y-3 rounded-xl bg-white/[0.03] p-3">
              <Input
                type="password"
                placeholder="Choose a PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="h-11 rounded-xl bg-input/40"
              />
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Recovery (in case you forget)
                </Label>
                <Input
                  placeholder="Recovery question (e.g. First pet's name?)"
                  value={recoveryQ}
                  onChange={(e) => setRecoveryQ(e.target.value)}
                  className="h-11 rounded-xl bg-input/40"
                />
                <Input
                  placeholder="Answer"
                  value={recoveryA}
                  onChange={(e) => setRecoveryA(e.target.value)}
                  className="h-11 rounded-xl bg-input/40"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <div>
              <Label className="cursor-pointer">Invisible mode</Label>
              <p className="text-xs text-muted-foreground">Hide from main grid.</p>
            </div>
            <Switch checked={isInvisible} onCheckedChange={setIsInvisible} />
          </div>
          <Button onClick={create} disabled={busy || !title.trim()} className="w-full h-11 rounded-xl">
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
