import { auth, defineMcp } from "@lovable.dev/mcp-js";
import { listCollectionsTool, listMediaTool, searchCollectionsTool } from "./tools/collections";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "lumina-vault",
  title: "Lumina Vault",
  version: "0.1.0",
  instructions:
    "Read-only access to the signed-in user's Lumen photo and video collections. PIN-locked collections stay locked until unlocked in the app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCollectionsTool, searchCollectionsTool, listMediaTool],
});
