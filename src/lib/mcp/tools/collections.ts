import { defineTool, ToolError, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

function client(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
  return supabaseForUser(ctx);
}

type Row = {
  id: string;
  title: string;
  nickname: string | null;
  is_private: boolean;
  has_pin: boolean;
  is_invisible: boolean;
  created_at: string;
};

const toJson = (c: Row) => {
  const locked = c.is_private && c.has_pin;
  return {
    id: c.id,
    title: locked ? "Locked collection" : c.title,
    nickname: locked ? null : c.nickname,
    locked,
    hidden: c.is_invisible,
    created_at: c.created_at,
  };
};

async function fetchCollections(ctx: ToolContext, query?: string) {
  const { data, error } = await client(ctx)
    .from("collections")
    .select("id, title, nickname, is_private, has_pin, is_invisible, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new ToolError(error.message);
  let rows = (data ?? []).map(toJson);
  if (query) {
    const q = query.toLowerCase();
    rows = rows.filter(
      (r) => !r.locked && (r.title.toLowerCase().includes(q) || (r.nickname ?? "").toLowerCase().includes(q)),
    );
  }
  return rows;
}

export const listCollectionsTool = defineTool({
  name: "list_collections",
  title: "List collections",
  description: "List the signed-in user's collections. Titles of PIN-locked collections are hidden.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const collections = await fetchCollections(ctx);
    return {
      content: [{ type: "text", text: JSON.stringify(collections) }],
      structuredContent: { collections },
    };
  },
});

export const searchCollectionsTool = defineTool({
  name: "search_collections",
  title: "Search collections",
  description: "Find the signed-in user's unlocked collections by title or nickname.",
  inputSchema: { query: z.string().min(1).describe("Text to match in title or nickname.") },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ query }, ctx) => {
    const collections = await fetchCollections(ctx, query);
    return {
      content: [{ type: "text", text: JSON.stringify(collections) }],
      structuredContent: { collections },
    };
  },
});

export const listMediaTool = defineTool({
  name: "list_media",
  title: "List media in a collection",
  description:
    "List photos and videos (metadata only) in one collection. PIN-locked collections must be unlocked in the app first.",
  inputSchema: { collection_id: z.string().uuid().describe("Collection id from list_collections.") },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ collection_id }, ctx) => {
    const sb = client(ctx);
    const { data: col, error: cErr } = await sb
      .from("collections")
      .select("id, is_private, has_pin")
      .eq("id", collection_id)
      .maybeSingle();
    if (cErr) throw new ToolError(cErr.message);
    if (!col) throw new ToolError("Collection not found.");
    if (col.is_private && col.has_pin) {
      const { data: unlock } = await sb
        .from("collection_unlocks")
        .select("collection_id")
        .eq("collection_id", collection_id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (!unlock) throw new ToolError("This collection is locked. Unlock it with your PIN in the app first.");
    }
    const { data, error } = await sb
      .from("media")
      .select("id, title, description, media_type, is_favorite, created_at")
      .eq("collection_id", collection_id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new ToolError(error.message);
    const media = (data ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      media_type: m.media_type,
      is_favorite: m.is_favorite,
      created_at: m.created_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(media) }], structuredContent: { media } };
  },
});
