import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

// Bot identity
export const BOT_NAME = "TschuuulAI";
export const BOT_AVATAR = "https://punks.art/api/traits/006-125-127-124-220?background=v2&format=png&size=240";

const BOT_PERSONALITY = `You are TschuuulAI, the friendly AI mod of Made By Punks. You're inspired by Tschuuuly, the legendary mod of the CryptoPunks Discord.

IMPORTANT CONTEXT:
- Contributors are NOT developers - they're community members adding their projects
- They may not know YAML, markdown, or git - be patient and helpful
- Your job is to make their submission work, not to lecture them
- If you can fix something, just fix it - don't ask unnecessary questions
- Be proactive: if something is missing but you can guess it, suggest it

Your personality:
- Based and straightforward - no cringe crypto speak (NEVER say "gm", "wagmi", "lfg")
- Warm and helpful, especially to first-time contributors
- Casual, friendly language - like helping a friend
- Focus on SOLUTIONS, not problems
- If the PR is good, just approve it with a short friendly message`;

export const REPO_OWNER = process.env.GITHUB_REPO_OWNER || "madebypunks";
export const REPO_NAME = process.env.GITHUB_REPO_NAME || "directory";

export interface PRFile {
  filename: string;
  status: string;
  contents?: string;
}

export interface ReviewResult {
  summary: string;
  validationErrors: string[];
  suggestions: string[];
  fixedFiles: { filename: string; content: string }[];
  needsClarification: string[];
  approved: boolean;
}

export interface PRDetails {
  number: number;
  title: string;
  body: string | null;
  user: { login: string };
}

// GitHub API helper
export async function github(path: string, options?: RequestInit) {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      ...options?.headers,
    },
  });
  return res.json();
}

export async function getOpenPRs() {
  return github("/pulls?state=open");
}

export async function getPRComments(prNumber: number) {
  return github(`/issues/${prNumber}/comments`);
}

export async function getPRFiles(prNumber: number): Promise<PRFile[]> {
  const files = await github(`/pulls/${prNumber}/files`);
  const result: PRFile[] = [];

  for (const file of files) {
    const isContentFile = file.filename.startsWith("content/punks/") || file.filename.startsWith("content/projects/");

    if (isContentFile && file.filename.endsWith(".md") && file.status !== "removed") {
      const res = await fetch(file.raw_url, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      });
      result.push({ filename: file.filename, status: file.status, contents: await res.text() });
    }
  }
  return result;
}

export async function getPRDetails(prNumber: number): Promise<PRDetails> {
  return github(`/pulls/${prNumber}`);
}

export async function postComment(prNumber: number, body: string) {
  return github(`/issues/${prNumber}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

export async function analyzeWithClaude(prDetails: PRDetails, files: PRFile[]): Promise<ReviewResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const filesContext = files
    .filter((f) => f.contents)
    .map((f) => `### ${f.filename}\n\`\`\`markdown\n${f.contents}\n\`\`\``)
    .join("\n\n");

  const prompt = `${BOT_PERSONALITY}

You are reviewing pull requests for Made By Punks, a community directory of CryptoPunks projects.

## Expected File Formats

### Project files (content/projects/{slug}.md)
- Filename must be lowercase with hyphens only (e.g., my-cool-project.md)
- Required YAML frontmatter fields:
  - name: string (project name, cannot be empty)
  - description: string (1-2 sentences, cannot be empty)
  - url: string (valid URL starting with https://)
  - launchDate: string (YYYY-MM-DD format, e.g., 2024-06-15)
  - tags: array of strings (at least one tag)
  - creators: array of numbers (punk IDs, 0-9999)
- Optional fields:
  - thumbnail: string (path like /projects/my-project.png)
  - links: array of URLs
  - hidden: boolean
  - ded: boolean (project is dead/discontinued)
  - featured: boolean

### Punk files (content/punks/{id}.md)
- Filename must be a number (the punk ID, e.g., 2113.md)
- Optional YAML frontmatter:
  - name: string
  - links: array of URLs
- Body: optional markdown bio

## PR Details
- **Title:** ${prDetails.title}
- **Author:** ${prDetails.user.login}
- **Description:** ${prDetails.body || "No description provided"}

## Files Changed
${filesContext}

## Your Task
BE PROACTIVE - fix things yourself whenever possible!

1. Check each file against the schema
2. Common issues to FIX (don't just report - provide the fix):
   - Empty description → ask what the project does
   - Wrong date format → convert to YYYY-MM-DD
   - creators as strings → convert to numbers
   - Missing tags → suggest relevant ones based on the project
   - Typos in field names → fix them
3. If the PR looks good → approve with a short friendly message
4. If there are issues → provide the COMPLETE fixed file

Respond in JSON:
{
  "summary": "Brief, friendly summary (1-2 sentences max)",
  "approved": true/false,
  "validationErrors": ["only critical issues that block the PR"],
  "suggestions": ["nice-to-have improvements, keep it short"],
  "needsClarification": ["only ask if you truly cannot guess - be specific"],
  "fixedFiles": [{ "filename": "content/projects/example.md", "content": "complete fixed file" }]
}

RULES:
- Keep summary SHORT - this is not an essay
- If you can fix it, fix it - don't ask
- fixedFiles must contain the COMPLETE file content (frontmatter + body)
- Only set approved:false if there are real blocking issues
- Be friendly but concise - respect people's time`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0];
  if (text.type !== "text") throw new Error("Unexpected response");
  const match = text.text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

export function formatComment(result: ReviewResult): string {
  const lines: string[] = [
    `<img src="${BOT_AVATAR}" width="48" height="48" align="left" style="margin-right: 12px;" />\n`,
    `### ${BOT_NAME}\n`,
    result.summary,
    "",
    result.approved ? "✅ **Ready to merge**\n" : "⚠️ **Changes requested**\n",
  ];

  if (result.validationErrors.length) {
    lines.push("### ❌ Issues\n", ...result.validationErrors.map((e) => `- ${e}`), "");
  }
  if (result.suggestions.length) {
    lines.push("### 💡 Suggestions\n", ...result.suggestions.map((s) => `- ${s}`), "");
  }
  if (result.needsClarification.length) {
    lines.push("### ❓ Questions\n", ...result.needsClarification.map((q) => `- ${q}`), "");
  }
  if (result.fixedFiles.length) {
    lines.push("### 🔧 Fixes\n");
    for (const f of result.fixedFiles) {
      lines.push(`<details><summary><code>${f.filename}</code></summary>\n`, "```markdown", f.content, "```", "</details>\n");
    }
  }

  lines.push("---", `*${BOT_NAME} - AI mod inspired by the legendary Tschuuuly*`);
  return lines.join("\n");
}

// Review a single PR
export async function reviewPR(prNumber: number): Promise<{ reviewed: boolean; reason?: string }> {
  const comments = await getPRComments(prNumber);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alreadyReviewed = comments.some((c: any) => c.body?.includes(BOT_NAME));

  if (alreadyReviewed) {
    return { reviewed: false, reason: "already_reviewed" };
  }

  const [details, files] = await Promise.all([getPRDetails(prNumber), getPRFiles(prNumber)]);

  if (files.length === 0) {
    return { reviewed: false, reason: "no_content_files" };
  }

  const result = await analyzeWithClaude(details, files);
  await postComment(prNumber, formatComment(result));

  return { reviewed: true };
}

// Webhook signature verification
export function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expectedSignature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
