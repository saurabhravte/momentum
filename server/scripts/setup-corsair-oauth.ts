/**
 * Seeds the integration-level OAuth client credentials that Corsair needs
 * before generateOAuthUrl() can build a valid Google consent URL.
 *
 * WHY THIS EXISTS
 * ---------------
 * migrate-corsair.ts only CREATES the corsair_* tables. The Gmail + Google
 * Calendar plugins are OAuth plugins, and Corsair stores the shared OAuth2
 * client_id / client_secret / redirect_url in `corsair_integrations.config`
 * (encrypted via the KEK). If those are never written, every connect attempt
 * produces Google's `invalid_client` error — surfaced in the UI as
 * "invalid credential".
 *
 * This script writes them using Corsair's integration-level key managers:
 *   corsair.keys.<plugin>.set_client_id / set_client_secret / set_redirect_url
 *
 * It is idempotent — running it again just overwrites with the same values.
 *
 * RUN:  pnpm --filter @momentum/server setup:corsair   (see package.json script below)
 *       or:  tsx server/scripts/setup-corsair-oauth.ts
 *
 * REQUIRED ENV (already in server/.env):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   API_ORIGIN              (used to derive the Corsair callback redirect URI)
 */
import "dotenv/config";
import { corsair } from "../src/common/config/corsair";
import { env } from "../src/common/config/env";

// MUST be byte-for-byte identical to the redirect URI used at runtime in
// connections.controller.ts (REDIRECT_URI = `${API_ORIGIN}/api/connections/callback`)
// AND registered as an Authorized redirect URI in the Google Cloud console.
const REDIRECT_URI = `${env.API_ORIGIN}/api/connections/callback`;

// Both Google plugins share the same Google OAuth client.
const GOOGLE_PLUGINS = ["gmail", "googlecalendar"] as const;

type IntegrationKeys = {
  set_client_id: (v: string | null) => Promise<void>;
  set_client_secret: (v: string | null) => Promise<void>;
  set_redirect_url: (v: string | null) => Promise<void>;
};

async function main() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.error(
      "✗ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are empty. Fill them in server/.env first.",
    );
    process.exit(1);
  }

  // `corsair.keys` is the integration-level (shared-across-tenants) key manager.
  const keys = (corsair as unknown as { keys: Record<string, IntegrationKeys> }).keys;

  for (const plugin of GOOGLE_PLUGINS) {
    const k = keys[plugin];
    if (!k) {
      console.error(`✗ Plugin "${plugin}" not registered on the Corsair instance.`);
      process.exit(1);
    }
    await k.set_client_id(env.GOOGLE_CLIENT_ID);
    await k.set_client_secret(env.GOOGLE_CLIENT_SECRET);
    await k.set_redirect_url(REDIRECT_URI);
    console.log(`✓ ${plugin}: client credentials + redirect_url seeded`);
  }

  console.log("");
  console.log("Corsair OAuth setup complete.");
  console.log(`Redirect URI in use: ${REDIRECT_URI}`);
  console.log("Make sure this EXACT URI is an Authorized redirect URI in Google Cloud Console.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Corsair OAuth setup failed:", e);
  process.exit(1);
});
