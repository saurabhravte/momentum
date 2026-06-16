import "dotenv/config";
import { setupCorsair } from "corsair/setup";
import { corsair } from "../src/common/config/corsair";
import { env } from "../src/common/config/env";

// MUST be byte-for-byte identical to the redirect URI used at runtime in
// connections.controller.ts (`${API_ORIGIN}/api/connections/callback`) AND
// registered as an Authorized redirect URI in the Google Cloud console.
const REDIRECT_URI = `${env.API_ORIGIN}/api/connections/callback`;

async function main() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.error("✗ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are empty. Fill them in server/.env first.");
    process.exit(1);
  }

  // Field names are Corsair's oauth_2 integration-level fields:
  // client_id, client_secret, redirect_url. Gmail + Calendar share one client.
  const googleCreds = {
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_url: REDIRECT_URI,
  };

  // setupCorsair creates the integration/account rows AND writes the creds.
  // Multi-tenant integration-level setup doesn't need a tenantId.
  const log = await setupCorsair(corsair, {
    credentials: {
      gmail: googleCreds,
      googlecalendar: googleCreds,
    },
  });

  console.log(log);
  console.log("");
  console.log("✓ Corsair OAuth setup complete (integrations created + credentials seeded).");
  console.log(`Redirect URI in use: ${REDIRECT_URI}`);
  console.log("Make sure this EXACT URI is an Authorized redirect URI in Google Cloud Console.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Corsair OAuth setup failed:", e);
  process.exit(1);
});
