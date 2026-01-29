import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, reviewPR, BOT_NAME } from "../lib";

interface PullRequestEvent {
  action: string;
  number: number;
  pull_request: {
    number: number;
    title: string;
    state: string;
  };
}

interface IssueCommentEvent {
  action: string;
  issue: {
    number: number;
    pull_request?: { url: string };
  };
  comment: {
    body: string;
    user: { login: string };
  };
}

type WebhookEvent = PullRequestEvent | IssueCommentEvent;

function isPullRequestEvent(event: WebhookEvent): event is PullRequestEvent {
  return "pull_request" in event;
}

function isIssueCommentEvent(event: WebhookEvent): event is IssueCommentEvent {
  return "comment" in event && "issue" in event;
}

// POST /api/mod/webhook - Receive GitHub webhook events
export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!githubToken || !anthropicKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // Get raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  // Verify webhook signature if secret is configured
  if (webhookSecret) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = request.headers.get("x-github-event");
  const payload: WebhookEvent = JSON.parse(rawBody);

  // Handle pull_request events
  if (event === "pull_request" && isPullRequestEvent(payload)) {
    // Only review on opened or synchronize (new commits pushed)
    if (payload.action === "opened" || payload.action === "synchronize") {
      const prNumber = payload.pull_request.number;

      try {
        const result = await reviewPR(prNumber);
        return NextResponse.json({
          bot: BOT_NAME,
          event: "pull_request",
          action: payload.action,
          pr: prNumber,
          ...result,
        });
      } catch (error) {
        console.error(`Error reviewing PR #${prNumber}:`, error);
        return NextResponse.json(
          { error: "Failed to review PR", pr: prNumber },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      bot: BOT_NAME,
      event: "pull_request",
      action: payload.action,
      skipped: true,
      reason: "action_not_supported",
    });
  }

  // Handle issue_comment events (for conversational replies)
  if (event === "issue_comment" && isIssueCommentEvent(payload)) {
    // Only handle comments on PRs (not regular issues)
    if (!payload.issue.pull_request) {
      return NextResponse.json({
        bot: BOT_NAME,
        event: "issue_comment",
        skipped: true,
        reason: "not_a_pr",
      });
    }

    // Only handle new comments that mention the bot
    if (payload.action !== "created") {
      return NextResponse.json({
        bot: BOT_NAME,
        event: "issue_comment",
        skipped: true,
        reason: "not_created",
      });
    }

    const commentBody = payload.comment.body.toLowerCase();
    const mentionsBot = commentBody.includes("@tschuuulai") || commentBody.includes("tschuuulai");

    if (!mentionsBot) {
      return NextResponse.json({
        bot: BOT_NAME,
        event: "issue_comment",
        skipped: true,
        reason: "not_mentioned",
      });
    }

    // Re-review the PR when mentioned
    const prNumber = payload.issue.number;
    try {
      // Force a new review by not checking for existing comments
      const result = await reviewPR(prNumber);
      return NextResponse.json({
        bot: BOT_NAME,
        event: "issue_comment",
        action: "re_review",
        pr: prNumber,
        ...result,
      });
    } catch (error) {
      console.error(`Error re-reviewing PR #${prNumber}:`, error);
      return NextResponse.json(
        { error: "Failed to re-review PR", pr: prNumber },
        { status: 500 }
      );
    }
  }

  // Unhandled event
  return NextResponse.json({
    bot: BOT_NAME,
    event,
    skipped: true,
    reason: "event_not_supported",
  });
}
