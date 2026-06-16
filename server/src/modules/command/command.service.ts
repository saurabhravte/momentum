import { nanoid } from "nanoid";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { ClaudeProvider } from "@corsair-dev/mcp";
import type { CommandResponse, ProposedAction } from "@momentum/shared";
import { db, schema } from "../../common/config/db";
import { corsairFor } from "../../common/config/corsair";
import { fenceUntrusted } from "../../common/services/ai/llm";
import { env } from "../../common/config/env";
import * as emailSvc from "../inbox/inbox.service";
import * as calSvc from "../calendar/calendar.service";
import * as slackSvc from "../integrations/slack.service";
import * as ghSvc from "../integrations/github.service";
import { logActivity } from "../../common/services/activity.service";

const READ_VERB = /(search|list|get|read|fetch|find|view|lookup)/i;
const MUTATION_VERB =
  /(send|create|post|update|delete|remove|add|reply|invite|archive|move|write|set|patch|put|draft)/i;
const isReadOnly = (name: string) => READ_VERB.test(name) && !MUTATION_VERB.test(name);

const PROPOSAL_KIND = {
  propose_send_email: "send_email",
  propose_create_event: "create_event",
  propose_slack_post: "slack_post",
  propose_github_issue: "github_create_issue",
} as const satisfies Record<string, ProposedAction["kind"]>;

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data).slice(0, 6000) }],
});

export async function runCommand(userId: string, userTz: string, input: string): Promise<CommandResponse> {
  if (!env.ANTHROPIC_API_KEY) {
    return { reply: "Connect an Anthropic API key in .env to use the command bar.", proposals: [] };
  }

  const nowIso = new Date().toISOString();
  const proposals: ProposedAction[] = [];

  // A propose_* tool: validates input, records an approval request, executes nothing.
  const propose = (toolName: keyof typeof PROPOSAL_KIND, description: string, shape: z.ZodRawShape) =>
    tool(toolName, description, shape, async (args) => {
      const id = nanoid();
      const kind = PROPOSAL_KIND[toolName];
      const desc = describeProposal(kind, args as Record<string, unknown>);
      await db
        .insert(schema.proposedActions)
        .values({ id, userId, kind, description: desc, payload: args as Record<string, unknown>, status: "pending" });
      proposals.push({
        id,
        kind,
        description: desc,
        payload: args as Record<string, unknown>,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      await logActivity(userId, "agent", "action.proposed", desc, id);
      return ok({ proposed: true, id, note: "Awaiting user approval in the UI." });
    });

  // Fast, local read tools backed by the app's existing services.
  const readTools = [
    tool(
      "search_email",
      "Semantic search over the user's cached email (fast, local).",
      { query: z.string() },
      async (a) => ok(await emailSvc.localSearch(userId, a.query, 8)),
    ),
    tool(
      "list_events",
      "List the user's calendar events between two ISO UTC datetimes.",
      { from: z.string(), to: z.string() },
      async (a) => ok(await calSvc.listEvents(userId, a.from, a.to)),
    ),
    tool("list_prs", "List GitHub PRs awaiting the user's review.", {}, async () =>
      ok(await ghSvc.prsAwaitingReview(userId)),
    ),
  ];

  const proposeTools = [
    propose("propose_send_email", "Propose sending an email. Requires user approval before anything is sent.", {
      to: z.array(z.string()),
      subject: z.string(),
      body: z.string(),
    }),
    propose("propose_create_event", "Propose a calendar event + invites. Requires user approval before creation.", {
      title: z.string(),
      start: z.string().describe("ISO UTC"),
      end: z.string().describe("ISO UTC"),
      attendees: z.array(z.string()).optional(),
    }),
    propose("propose_slack_post", "Propose posting a Slack message. Requires user approval.", {
      channel: z.string(),
      text: z.string(),
    }),
    propose("propose_github_issue", "Propose creating a GitHub issue. Requires user approval.", {
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      body: z.string().optional(),
    }),
  ];

  // Corsair's own tools via the official adapter, tenant-scoped, READ-ONLY only.
  let corsairReadTools: Awaited<ReturnType<ClaudeProvider["build"]>> = [];
  try {
    const built = await new ClaudeProvider().build({ corsair: corsairFor(userId) });
    corsairReadTools = built.filter((t) => isReadOnly(t.name));
  } catch {
    // If the adapter can't initialise (e.g. no connected providers yet), the
    // agent still works with the local read tools above.
    corsairReadTools = [];
  }

  const server = createSdkMcpServer({
    name: "momentum",
    tools: [...readTools, ...proposeTools, ...corsairReadTools],
  });

  const stream = query({
    prompt: fenceUntrusted("user_command", input),
    options: {
      model: env.AI_AGENT_MODEL,
      mcpServers: { momentum: server },
      systemPrompt:
        `You are Momentum's command agent. Now (UTC): ${nowIso}. User timezone: ${userTz} — interpret natural-language times ("9 AM next Thursday") in the user's timezone and convert to UTC ISO. ` +
        `Read tools run immediately. Anything outbound (email, invite, Slack post, issue) MUST go through a propose_* tool and awaits the user's approval. Never claim something was sent.`,
    },
  });

  let reply = "";
  for await (const message of stream) {
    if (message.type === "result" && message.subtype === "success") reply += message.result;
  }
  return { reply: reply.trim() || "Done.", proposals };
}

function describeProposal(kind: ProposedAction["kind"], args: Record<string, unknown>): string {
  switch (kind) {
    case "send_email":
      return `Send email “${args.subject}” to ${(args.to as string[])?.join(", ")}`;
    case "create_event":
      return `Create event “${args.title}” at ${args.start} with ${((args.attendees as string[]) ?? []).join(", ") || "no invitees"}`;
    case "slack_post":
      return `Post to Slack #${args.channel}`;
    case "github_create_issue":
      return `Create GitHub issue “${args.title}” in ${args.owner}/${args.repo}`;
    default:
      return kind;
  }
}

/** The ONLY code path that turns a proposal into a real side effect. */
export async function resolveProposal(userId: string, id: string, approve: boolean) {
  const rows = await db
    .select()
    .from(schema.proposedActions)
    .where(and(eq(schema.proposedActions.id, id), eq(schema.proposedActions.userId, userId)))
    .limit(1);
  const p = rows[0];
  if (!p || p.status !== "pending") return null;

  if (!approve) {
    await db
      .update(schema.proposedActions)
      .set({ status: "rejected", resolvedAt: new Date() })
      .where(eq(schema.proposedActions.id, id));
    await logActivity(userId, "user", "action.rejected", p.description, id);
    return { status: "rejected" as const };
  }

  const payload = p.payload as Record<string, unknown>;
  try {
    if (p.kind === "send_email") {
      await emailSvc.sendEmail(userId, {
        to: payload.to as string[],
        subject: String(payload.subject),
        body: String(payload.body),
      });
    } else if (p.kind === "create_event") {
      await calSvc.createEvent(userId, {
        title: String(payload.title),
        start: String(payload.start),
        end: String(payload.end ?? new Date(new Date(String(payload.start)).getTime() + 1_800_000).toISOString()),
        attendees: (payload.attendees as string[]) ?? [],
      });
    } else if (p.kind === "slack_post") {
      await slackSvc.postMessage(userId, String(payload.channel), String(payload.text));
    } else if (p.kind === "github_create_issue") {
      await ghSvc.createIssue(
        userId,
        String(payload.owner),
        String(payload.repo),
        String(payload.title),
        String(payload.body ?? ""),
      );
    }
    await db
      .update(schema.proposedActions)
      .set({ status: "executed", resolvedAt: new Date() })
      .where(eq(schema.proposedActions.id, id));
    await logActivity(userId, "user", "action.approved", p.description, id);
    return { status: "executed" as const };
  } catch {
    await db
      .update(schema.proposedActions)
      .set({ status: "failed", resolvedAt: new Date() })
      .where(eq(schema.proposedActions.id, id));
    return { status: "failed" as const };
  }
}
