import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CollectionEditDialog({
  collectionId,
  currentTitle,
  currentDescription,
}: {
  collectionId: string;
  currentTitle: string;
  currentDescription: string | null;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(currentTitle);
    setDescription(currentDescription ?? "");
  }, [open, currentDescription, currentTitle]);

  const save = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      toast.error("A collection needs a name");
      return;
    }

    setBusy(true);
    const { error } = await supabase
      .from("collections")
      .update({ title: nextTitle, description: description.trim() || null })
      .eq("id", collectionId);
    setBusy(false);

    if (error) {
      toast.error("Could not update collection");
      return;
    }

    toast.success("Collection updated");
    qc.invalidateQueries({ queryKey: ["collection", collectionId] });
    qc.invalidateQueries({ queryKey: ["collections"] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-full">
          <Pencil className="mr-1.5 h-4 w-4" /> Edit collection
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <label htmlFor="collection-title" className="text-sm font-medium">Name</label>
            <Input
              id="collection-title"
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Summer Moments"
              className="h-11 rounded-xl bg-input/40"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="collection-description" className="text-sm font-medium">Description</label>
            <Textarea
              id="collection-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A few words about this collection"
              rows={4}
              className="resize-none rounded-xl bg-input/40"
            />
          </div>
          <Button onClick={save} disabled={busy || !title.trim()} className="h-11 w-full rounded-xl">
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}