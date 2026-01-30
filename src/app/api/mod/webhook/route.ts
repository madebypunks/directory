import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, reviewPR, getPRComments, handleDiscussion, handleIssue, getIssueComments } from "../lib";

const BOT_LOGIN = `${process.env.GITHUB_APP_SLUG || "punkmodbot"}[bot]`;

interface PullRequestEvent {
  action: string;
  pull_request: {
    number: number;
    title: string;
    state: string;
  };
}

interface IssuesEvent {
  action: string;
  issue: {
    number: number;
    title: string;
    body: string | null;
    user: { login: string };
    pull_request?: { url: string }; // If present, this is a PR not an issue
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

interface DiscussionEvent {
  action: string;
  discussion: {
    number: number;
    title: string;
    body: string;
  };
}

interface DiscussionCommentEvent {
  action: string;
  discussion: {
    number: number;
    title: string;
  };
  comment: {
    body: string;
    user: { login: string };
  };
}

type WebhookEvent = PullRequestEvent | IssuesEvent | IssueCommentEvent | DiscussionEvent | DiscussionCommentEvent;

function isPullRequestEvent(event: WebhookEvent): event is PullRequestEvent {
  return "pull_request" in event && !("issue" in event);
}

function isIssuesEvent(event: WebhookEvent): event is IssuesEvent {
  return "issue" in event && !("comment" in event) && !("issue" in event && "pull_request" in (event as IssuesEvent).issue);
}

function isIssueCommentEvent(event: WebhookEvent): event is IssueCommentEvent {
  return "comment" in event && "issue" in event;
}

function isDiscussionEvent(event: WebhookEvent): event is DiscussionEvent {
  return "discussion" in event && !("comment" in event);
}

function isDiscussionCommentEvent(event: WebhookEvent): event is DiscussionCommentEvent {
  return "discussion" in event && "comment" in event;
}

export async function POST(request: NextRequest) {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!appId || !installationId || !privateKey || !anthropicKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (webhookSecret && !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const payload: WebhookEvent = JSON.parse(rawBody);

  // Handle pull_request events
  if (event === "pull_request" && isPullRequestEvent(payload)) {
    if (payload.action === "opened" || payload.action === "synchronize") {
      const prNumber = payload.pull_request.number;

      try {
        const result = await reviewPR(prNumber);
        return NextResponse.json({ event: "pull_request", action: payload.action, pr: prNumber, ...result });
      } catch (error) {
        console.error(`Error reviewing PR #${prNumber}:`, error);
        return NextResponse.json({ error: "Failed to review PR", pr: prNumber }, { status: 500 });
      }
    }

    return NextResponse.json({ event: "pull_request", action: payload.action, skipped: true });
  }

  // Handle issues events (new issue opened or edited)
  if (event === "issues" && isIssuesEvent(payload)) {
    // Skip if this is actually a PR (issues API also fires for PRs)
    if (payload.issue.pull_request) {
      return NextResponse.json({ event: "issues", skipped: true, reason: "is_pull_request" });
    }

    if (payload.action !== "opened" && payload.action !== "edited") {
      return NextResponse.json({ event: "issues", action: payload.action, skipped: true });
    }

    const issueNumber = payload.issue.number;

    try {
      const result = await handleIssue(issueNumber);
      return NextResponse.json({ event: "issues", action: payload.action, issue: issueNumber, ...result });
    } catch (error) {
      console.error(`Error handling issue #${issueNumber}:`, error);
      return NextResponse.json({ error: "Failed to handle issue", issue: issueNumber }, { status: 500 });
    }
  }

  // Handle issue_comment events (for both PRs and standalone issues)
  if (event === "issue_comment" && isIssueCommentEvent(payload)) {
    if (payload.action !== "created") {
      return NextResponse.json({ event: "issue_comment", skipped: true, reason: "not_created" });
    }

    // Ignore comments from the bot itself (avoid infinite loops)
    if (payload.comment.user.login === BOT_LOGIN) {
      return NextResponse.json({ event: "issue_comment", skipped: true, reason: "bot_comment" });
    }

    const issueNumber = payload.issue.number;
    const isPR = !!payload.issue.pull_request;

    if (isPR) {
      // Handle PR comment
      const comments = await getPRComments(issueNumber);
      const botHasCommented = comments.some((c) => c.user.login === BOT_LOGIN);

      // If bot hasn't commented yet, only respond if mentioned
      if (!botHasCommented) {
        const commentBody = payload.comment.body.toLowerCase();
        const mentionsBot = commentBody.includes("@punkmodbot") || commentBody.includes("punkmodbot");
        if (!mentionsBot) {
          return NextResponse.json({ event: "issue_comment", skipped: true, reason: "not_participating" });
        }
      }

      try {
        const result = await reviewPR(issueNumber, true); // Force re-review
        return NextResponse.json({ event: "issue_comment", action: "re_review", pr: issueNumber, ...result });
      } catch (error) {
        console.error(`Error re-reviewing PR #${issueNumber}:`, error);
        return NextResponse.json({ error: "Failed to re-review PR", pr: issueNumber }, { status: 500 });
      }
    } else {
      // Handle standalone issue comment
      const comments = await getIssueComments(issueNumber);
      const botHasCommented = comments.some((c) => c.user.login === BOT_LOGIN);

      // If bot hasn't commented yet, only respond if mentioned
      if (!botHasCommented) {
        const commentBody = payload.comment.body.toLowerCase();
        const mentionsBot = commentBody.includes("@punkmodbot") || commentBody.includes("punkmodbot");
        if (!mentionsBot) {
          return NextResponse.json({ event: "issue_comment", skipped: true, reason: "not_participating" });
        }
      }

      try {
        const result = await handleIssue(issueNumber);
        return NextResponse.json({ event: "issue_comment", action: "reply", issue: issueNumber, ...result });
      } catch (error) {
        console.error(`Error replying to issue #${issueNumber}:`, error);
        return NextResponse.json({ error: "Failed to reply to issue", issue: issueNumber }, { status: 500 });
      }
    }
  }

  // Handle discussion events (new discussion created)
  if (event === "discussion" && isDiscussionEvent(payload)) {
    if (payload.action !== "created") {
      return NextResponse.json({ event: "discussion", action: payload.action, skipped: true });
    }

    const discussionNumber = payload.discussion.number;

    try {
      const result = await handleDiscussion(discussionNumber);
      return NextResponse.json({ event: "discussion", action: "created", discussion: discussionNumber, ...result });
    } catch (error) {
      console.error(`Error handling discussion #${discussionNumber}:`, error);
      return NextResponse.json({ error: "Failed to handle discussion", discussion: discussionNumber }, { status: 500 });
    }
  }

  // Handle discussion_comment events (someone replied in a discussion)
  if (event === "discussion_comment" && isDiscussionCommentEvent(payload)) {
    if (payload.action !== "created") {
      return NextResponse.json({ event: "discussion_comment", action: payload.action, skipped: true });
    }

    // Ignore comments from the bot itself (avoid infinite loops)
    if (payload.comment.user.login === BOT_LOGIN) {
      return NextResponse.json({ event: "discussion_comment", skipped: true, reason: "bot_comment" });
    }

    const discussionNumber = payload.discussion.number;

    try {
      const result = await handleDiscussion(discussionNumber);
      return NextResponse.json({ event: "discussion_comment", action: "reply", discussion: discussionNumber, ...result });
    } catch (error) {
      console.error(`Error replying to discussion #${discussionNumber}:`, error);
      return NextResponse.json({ error: "Failed to reply to discussion", discussion: discussionNumber }, { status: 500 });
    }
  }

  return NextResponse.json({ event, skipped: true, reason: "event_not_supported" });
}
