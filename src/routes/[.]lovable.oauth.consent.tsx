import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthResult = { data: any; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({ meta: [{ title: "Connect an assistant — Lumen" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("This link is missing its authorization request. Start the connection again from your assistant.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    const { data: u } = await supabase.auth.getUser();
    return { details: data, email: u.user?.email ?? "" };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md rounded-sm border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl">Couldn't load this request</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const { details, email } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "An assistant";
  const account = email.endsWith("@users.lumen.app") ? email.split("@")[0] : email;

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect was returned. Please try again."); return; }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-sm border border-border bg-card p-8">
        <h1 className="font-display text-2xl">Connect {name} to Lumen</h1>
        <p className="mt-3 text-sm text-muted-foreground">Signed in as <span className="text-foreground">{account}</span></p>
        <p className="mt-4 text-sm">{name} will be able to read your collection list and the items in collections you can open. Locked collections stay locked.</p>
        {details?.redirect_uri && <p className="mt-2 break-all text-xs text-muted-foreground">Returns to {details.redirect_uri}</p>}
        <p className="mt-2 text-xs text-muted-foreground">This does not bypass Lumen's permissions.</p>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex gap-3">
          <Button disabled={busy} onClick={() => decide(true)} className="flex-1">Approve</Button>
          <Button disabled={busy} variant="secondary" onClick={() => decide(false)} className="flex-1">Cancel connection</Button>
        </div>
      </div>
    </main>
  );
}
