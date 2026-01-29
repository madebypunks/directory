import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

// GitHub App config
const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_APP_INSTALLATION_ID = process.env.GITHUB_APP_INSTALLATION_ID;
const GITHUB_APP_SLUG = process.env.GITHUB_APP_SLUG || "punkmodbot";

// Decode private key (supports both base64 and raw PEM format)
function getPrivateKey(): string {
  const key = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!key) throw new Error("Missing GITHUB_APP_PRIVATE_KEY");

  // If it starts with "-----BEGIN", it's already PEM format
  if (key.startsWith("-----BEGIN")) {
    return key;
  }

  // Otherwise, assume it's base64 encoded
  return Buffer.from(key, "base64").toString("utf-8");
}

// Cache for installation token (expires after 1 hour)
let cachedToken: { token: string; expiresAt: number } | null = null;

const SYSTEM_PROMPT = `You are PunkModBot, the guardian of Made By Punks - a community directory of CryptoPunks projects.

WHO YOU ARE:
- A total CryptoPunks nerd who knows EVERYTHING about punk lore
- You know: the 10,000 punks, the 24x24 pixel art, Larva Labs origins (Matt & John), June 2017 launch
- You know the traits: Aliens (9), Apes (24), Zombies (88), and all the rare attributes
- You know the OG history: free mint, the wrapped punk drama, the Yuga Labs acquisition
- You know the culture: "looks rare", punk Twitter, the community memes
- You're genuinely passionate about the punk ecosystem and love seeing it grow
- You geek out when you see cool punk-related projects

YOUR ROLE AS GUARDIAN:
- You are the DEFENDER of the Made By Punks community
- You protect the directory from spam, scams, and low-quality submissions
- You are a PURIST with high standards - the directory must stay clean and valuable
- You care deeply about data quality: proper formatting, accurate info, no garbage
- You won't let just anything through - submissions must meet the community's standards
- But you're not a gatekeeper - you HELP people meet those standards

YOUR PRINCIPLES:
- Quality over quantity - better to have fewer great entries than lots of mediocre ones
- Accuracy matters - wrong dates, broken links, fake projects damage the community
- Respect the OGs - this directory represents real punk holders and their work
- No scams, no impersonation, no garbage - protect the community at all costs

YOUR MISSION:
- Help community members submit their projects correctly
- Make sure submissions are clean, complete, and legit
- Be POSITIVE and encouraging - guide people to meet the standards
- Catch scams and bad actors immediately - zero tolerance

CRITICAL ROLE:
- You are a PREPARATION assistant, NOT an approver
- You NEVER approve or merge PRs - that's ALWAYS for a human moderator
- Your job is to review, help fix issues, and prepare PRs for human review
- You flag when a PR is ready, but the final decision is ALWAYS human

IMPORTANT CONTEXT:
- Contributors are NOT developers - they're community members adding their projects
- They may not know YAML, markdown, or git - be patient and helpful
- Your job is to make their submission clean and complete
- If you can fix something, just fix it - don't ask unnecessary questions
- Be proactive: if something is missing but you can guess it, suggest it
- CHECK FOR SCAMS: if a project looks suspicious (fake URLs, impersonation, etc.), flag it

Your personality:
- Nerdy and enthusiastic about all things CryptoPunks
- Friendly and welcoming - celebrate new submissions!
- Helpful and patient, especially with first-time contributors
- Casual language - like a knowledgeable friend helping out
- You might drop punk references or trivia when relevant
- Keep it positive - every legit project is a win for the community`;

export const REPO_OWNER = process.env.GITHUB_REPO_OWNER || "madebypunks";
export const REPO_NAME = process.env.GITHUB_REPO_NAME || "directory";

export interface PRFile {
  filename: string;
  status: string;
  contents?: string;
}

export type ReviewStatus =
  | "ready_for_review"
  | "needs_changes"
  | "suspicious"
  | "needs_info";

export interface ReviewResult {
  summary: string;
  status: ReviewStatus;
  validationErrors: string[];
  suggestions: string[];
  fixedFiles: { filename: string; content: string }[];
  needsClarification: string[];
  suspiciousReasons?: string[];
}

export interface PRDetails {
  number: number;
  title: string;
  body: string | null;
  user: { login: string };
}

interface GitHubComment {
  user: { login: string; type: string };
  body: string;
}

// Generate JWT for GitHub App authentication
function generateJWT(): string {
  if (!GITHUB_APP_ID) {
    throw new Error("Missing GITHUB_APP_ID");
  }

  const privateKey = getPrivateKey();
  console.log("Private key starts with:", privateKey.substring(0, 40));
  console.log("Private key ends with:", privateKey.substring(privateKey.length - 40));

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Issued 60 seconds ago (clock drift)
    exp: now + 600, // Expires in 10 minutes
    iss: GITHUB_APP_ID,
  };

  // Base64url encode
  const base64url = (str: string) =>
    Buffer.from(str).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const unsignedToken = `${header}.${body}`;

  // Sign with private key
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  const signature = sign.sign(privateKey, "base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${unsignedToken}.${signature}`;
}

// Get installation access token (cached)
async function getInstallationToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  if (!GITHUB_APP_INSTALLATION_ID) {
    throw new Error("Missing GITHUB_APP_INSTALLATION_ID");
  }

  const jwt = generateJWT();
  console.log("Generated JWT (first 50 chars):", jwt.substring(0, 50));
  console.log("App ID:", GITHUB_APP_ID);
  console.log("Installation ID:", GITHUB_APP_INSTALLATION_ID);

  // First, verify the JWT by calling /app endpoint
  const appRes = await fetch("https://api.github.com/app", {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  const appData = await appRes.text();
  console.log("GET /app response:", appRes.status, appData.substring(0, 200));

  const res = await fetch(
    `https://api.github.com/app/installations/${GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to get installation token: ${error}`);
  }

  const data = await res.json();

  // Cache the token
  cachedToken = {
    token: data.token,
    expiresAt: new Date(data.expires_at).getTime(),
  };

  return data.token;
}

// GitHub API helper (uses App installation token)
export async function github(path: string, options?: RequestInit) {
  const token = await getInstallationToken();

  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      ...options?.headers,
    },
  });
  return res.json();
}

export async function getOpenPRs() {
  return github("/pulls?state=open");
}

export async function getPRComments(prNumber: number): Promise<GitHubComment[]> {
  return github(`/issues/${prNumber}/comments`);
}

export async function getPRFiles(prNumber: number): Promise<PRFile[]> {
  const token = await getInstallationToken();
  const files = await github(`/pulls/${prNumber}/files`);
  const result: PRFile[] = [];

  for (const file of files) {
    const isContentFile = file.filename.startsWith("content/punks/") || file.filename.startsWith("content/projects/");

    if (isContentFile && file.filename.endsWith(".md") && file.status !== "removed") {
      const res = await fetch(file.raw_url, {
        headers: { Authorization: `Bearer ${token}` },
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

  const prompt = `${SYSTEM_PROMPT}

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
3. If the PR looks good → mark as ready for human review
4. If there are issues → provide the COMPLETE fixed file

Respond in JSON:
{
  "summary": "Brief, friendly summary (1-2 sentences max)",
  "status": "ready_for_review" | "needs_changes" | "suspicious" | "needs_info",
  "validationErrors": ["only critical issues that block the PR"],
  "suggestions": ["nice-to-have improvements, keep it short"],
  "needsClarification": ["only ask if you truly cannot guess - be specific"],
  "fixedFiles": [{ "filename": "content/projects/example.md", "content": "complete fixed file" }],
  "suspiciousReasons": ["only if status is suspicious - explain why"]
}

STATUS GUIDE:
- "ready_for_review": Everything looks good, a human moderator can review and merge
- "needs_changes": The contributor needs to fix something (validation errors, missing info)
- "suspicious": Something looks off (fake URL, impersonation, scam vibes) - explain in suspiciousReasons
- "needs_info": You need more information from the contributor to proceed

RULES:
- Keep summary SHORT - this is not an essay
- If you can fix it, fix it - don't ask
- fixedFiles must contain the COMPLETE file content (frontmatter + body)
- You NEVER approve or merge - you only prepare for human review
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

function getStatusBadge(status: ReviewStatus): string {
  switch (status) {
    case "ready_for_review":
      return "✅ **READY FOR HUMAN REVIEW** - A moderator can now review and merge";
    case "needs_changes":
      return "🔄 **NEEDS CHANGES** - Please update your submission";
    case "suspicious":
      return "🚨 **FLAGGED** - This submission needs careful human verification";
    case "needs_info":
      return "❓ **WAITING FOR INFO** - Please answer the questions below";
  }
}

export function formatComment(result: ReviewResult): string {
  const lines: string[] = [result.summary, "", getStatusBadge(result.status), ""];

  if (result.status === "suspicious" && result.suspiciousReasons?.length) {
    lines.push("### 🚨 Flags", ...result.suspiciousReasons.map((r) => `- ${r}`), "");
  }
  if (result.validationErrors.length) {
    lines.push("### ❌ Issues", ...result.validationErrors.map((e) => `- ${e}`), "");
  }
  if (result.suggestions.length) {
    lines.push("### 💡 Suggestions", ...result.suggestions.map((s) => `- ${s}`), "");
  }
  if (result.needsClarification.length) {
    lines.push("### ❓ Questions", ...result.needsClarification.map((q) => `- ${q}`), "");
  }
  if (result.fixedFiles.length) {
    lines.push("### 🔧 Suggested Fixes", "*Copy these fixes to your files:*", "");
    for (const f of result.fixedFiles) {
      lines.push(`<details><summary><code>${f.filename}</code></summary>`, "", "```markdown", f.content, "```", "</details>", "");
    }
  }

  return lines.join("\n");
}

// Check if the bot has already commented on this PR
function hasAlreadyReviewed(comments: GitHubComment[]): boolean {
  const botLogin = `${GITHUB_APP_SLUG}[bot]`;
  console.log("Looking for bot:", botLogin);
  console.log("Comment authors:", comments.map((c) => c.user.login));
  return comments.some((c) => c.user.login === botLogin);
}

// Review a single PR
export async function reviewPR(prNumber: number, forceReview = false): Promise<{ reviewed: boolean; reason?: string }> {
  const comments = await getPRComments(prNumber);

  if (!forceReview && hasAlreadyReviewed(comments)) {
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
