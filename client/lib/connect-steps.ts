export type ConnectStep = { provider: string; name: string; steps: string[]; docs: string };

export const CONNECT_STEPS: ConnectStep[] = [
  {
    provider: "gmail",
    name: "Gmail",
    docs: "https://console.cloud.google.com/apis/credentials",
    steps: [
      "Open Connections → click Connect Gmail.",
      "Pick your Google account in the consent screen.",
      "Approve read/send scopes — we ask for the minimum.",
      "You're redirected back; status flips to Connected.",
    ],
  },
  {
    provider: "googlecalendar",
    name: "Google Calendar",
    docs: "https://console.cloud.google.com/apis/credentials",
    steps: [
      "In Connections, click Connect Google Calendar.",
      "Approve calendar read + availability scopes.",
      "Events and free/busy sync in the background.",
    ],
  },
  {
    provider: "slack",
    name: "Slack",
    docs: "https://api.slack.com/apps",
    steps: [
      "Create a Slack app at api.slack.com/apps.",
      "OAuth & Permissions → copy the Bot User OAuth Token (xoxb-…).",
      "Paste it into the Slack card in Connections.",
    ],
  },
  {
    provider: "github",
    name: "GitHub",
    docs: "https://github.com/settings/tokens",
    steps: [
      "Settings → Developer settings → Fine-grained tokens.",
      "Grant repo + pull-request read.",
      "Paste github_pat_… into the GitHub card.",
    ],
  },
];
