import { NextResponse } from "next/server";
import { getOpenPRs, reviewPR, BOT_NAME } from "./lib";

// GET /api/mod - Review all open PRs that haven't been reviewed yet
export async function GET() {
  const githubToken = process.env.GITHUB_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!githubToken || !anthropicKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const prs = await getOpenPRs();
  const reviewed: number[] = [];
  const skipped: { pr: number; reason: string }[] = [];

  for (const pr of prs) {
    const result = await reviewPR(pr.number);

    if (result.reviewed) {
      reviewed.push(pr.number);
    } else {
      skipped.push({ pr: pr.number, reason: result.reason || "unknown" });
    }

    // Rate limit between PRs
    await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json({
    bot: BOT_NAME,
    reviewed,
    skipped,
    total: prs.length,
  });
}
