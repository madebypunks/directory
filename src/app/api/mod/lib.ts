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
- Keep it positive - every legit project is a win for the community
- ALWAYS address the person you're responding to by their GitHub username (e.g., "Hey @username!")
- If someone other than the PR author talks to you, address THEM, not the PR author
- Make it personal - everyone in the conversation is part of the community`;

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

// URL content fetching via Jina Reader
interface UrlCheckResult {
  url: string;
  status: "ok" | "error" | "timeout";
  title?: string;
  description?: string;
  content?: string; // Truncated markdown content
  error?: string;
}

// Extract all URLs from PR file contents
function extractUrlsFromFiles(files: PRFile[]): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>)\]]+/g;
  const urls = new Set<string>();

  for (const file of files) {
    if (!file.contents) continue;
    const matches = file.contents.match(urlRegex);
    if (matches) {
      for (const url of matches) {
        // Clean up trailing punctuation
        const cleanUrl = url.replace(/[.,;:!?)]+$/, "");
        urls.add(cleanUrl);
      }
    }
  }

  return Array.from(urls);
}

// Fetch URL content via Jina Reader (returns clean markdown)
async function fetchUrlContent(url: string): Promise<UrlCheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      signal: controller.signal,
      headers: {
        Accept: "text/markdown",
        "X-Return-Format": "markdown",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { url, status: "error", error: `HTTP ${res.status}` };
    }

    const text = await res.text();

    // Extract title from first # heading or first line
    const titleMatch = text.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] || text.split("\n")[0]?.slice(0, 100);

    // Extract description (first paragraph after title)
    const descMatch = text.match(/^#.+\n+([^#\n].+)/m);
    const description = descMatch?.[1]?.slice(0, 200);

    // Truncate content to avoid context explosion (max 1500 chars)
    const content = text.length > 1500 ? text.slice(0, 1500) + "\n\n[...truncated]" : text;

    return { url, status: "ok", title, description, content };
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === "AbortError") {
      return { url, status: "timeout", error: "Request timed out (10s)" };
    }
    return { url, status: "error", error: String(e) };
  }
}

// Fetch all URLs from PR files (in parallel, max 5)
async function fetchAllUrls(files: PRFile[]): Promise<UrlCheckResult[]> {
  const urls = extractUrlsFromFiles(files);

  // Limit to 5 URLs to avoid rate limits and context explosion
  const urlsToFetch = urls.slice(0, 5);

  const results = await Promise.all(urlsToFetch.map(fetchUrlContent));
  return results;
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

// GitHub API helper for any repo (for working with forks)
async function githubRepo(owner: string, repo: string, path: string, options?: RequestInit) {
  const token = await getInstallationToken();

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
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

// Get PR head branch information (needed for pushing to the PR branch)
export interface PRBranchInfo {
  owner: string;     // Fork owner (or same as base for same-repo PRs)
  repo: string;      // Fork repo name
  branch: string;    // Branch name
  sha: string;       // Latest commit SHA
}

export async function getPRBranchInfo(prNumber: number): Promise<PRBranchInfo> {
  const pr = await github(`/pulls/${prNumber}`);
  return {
    owner: pr.head.repo.owner.login,
    repo: pr.head.repo.name,
    branch: pr.head.ref,
    sha: pr.head.sha,
  };
}

// Get file SHA from a branch (needed for updating existing files)
async function getFileSHA(owner: string, repo: string, path: string, branch: string): Promise<string | null> {
  try {
    const result = await githubRepo(owner, repo, `/contents/${path}?ref=${branch}`);
    return result.sha || null;
  } catch {
    return null; // File doesn't exist
  }
}

// Push fixed files to the PR branch
export async function pushFixesToPR(
  prNumber: number,
  fixedFiles: { filename: string; content: string }[]
): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  if (fixedFiles.length === 0) {
    return { success: false, error: "No files to push" };
  }

  try {
    const branchInfo = await getPRBranchInfo(prNumber);
    const token = await getInstallationToken();

    // Push each file as a separate commit (simpler than creating a tree)
    let lastCommitUrl = "";

    for (const file of fixedFiles) {
      // Get current file SHA if it exists (required for updates)
      const fileSHA = await getFileSHA(branchInfo.owner, branchInfo.repo, file.filename, branchInfo.branch);

      // Create or update the file
      const res = await fetch(
        `https://api.github.com/repos/${branchInfo.owner}/${branchInfo.repo}/contents/${file.filename}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `fix: Auto-fix by PunkModBot\n\n🤖 Applied formatting fixes to ${file.filename}`,
            content: Buffer.from(file.content).toString("base64"),
            branch: branchInfo.branch,
            ...(fileSHA ? { sha: fileSHA } : {}),
          }),
        }
      );

      if (!res.ok) {
        const error = await res.text();
        console.error(`Failed to push ${file.filename}:`, error);
        return { success: false, error: `Failed to update ${file.filename}: ${error}` };
      }

      const result = await res.json();
      lastCommitUrl = result.commit?.html_url || "";
    }

    return { success: true, commitUrl: lastCommitUrl };
  } catch (error) {
    console.error("Error pushing fixes:", error);
    return { success: false, error: String(error) };
  }
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

export async function analyzeWithClaude(prDetails: PRDetails, files: PRFile[], comments: GitHubComment[] = []): Promise<ReviewResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Fetch URL content in parallel with building context
  const urlResults = await fetchAllUrls(files);

  const filesContext = files
    .filter((f) => f.contents)
    .map((f) => `### ${f.filename}\n\`\`\`markdown\n${f.contents}\n\`\`\``)
    .join("\n\n");

  // Build URL context for Claude
  const urlContext = urlResults.length > 0
    ? `\n\n## URL Verification Results\nI've fetched the URLs from this submission. Use this to verify the project is legit:\n\n${urlResults
        .map((r) => {
          if (r.status === "ok") {
            return `### ${r.url}\n- **Status:** ✅ Accessible\n- **Title:** ${r.title || "N/A"}\n- **Description:** ${r.description || "N/A"}\n\n<details><summary>Page content (truncated)</summary>\n\n${r.content}\n\n</details>`;
          } else if (r.status === "timeout") {
            return `### ${r.url}\n- **Status:** ⏱️ Timeout - site may be slow or down`;
          } else {
            return `### ${r.url}\n- **Status:** ❌ Error: ${r.error}`;
          }
        })
        .join("\n\n")}`
    : "";

  const lastCommenter = comments.length > 0 ? comments[comments.length - 1].user.login : null;
  const conversationContext = comments.length > 0
    ? `\n\n## Conversation History\n${comments.map((c) => `**@${c.user.login}:** ${c.body}`).join("\n\n")}\n\nIMPORTANT:
- The last person who commented is @${lastCommenter} - address THEM directly in your response (not the PR author unless they're the same person)
- Read the conversation above and respond to what was asked
- Don't repeat your previous review - focus on what's new or what was asked
- If a moderator or maintainer is talking to you, acknowledge them appropriately
- BE FLEXIBLE: understand conversational requests! Examples:
  - "check the site" / "look at the URL" → use URL content to fill missing fields
  - "the description is X" → update the file with X
  - "it launched last month" → figure out the date and add it
  - "use whatever you think is best" → make a reasonable choice and apply it
  - ANY instruction that implies you should do something → DO IT and push the fix!`
    : "";

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  const prompt = `${SYSTEM_PROMPT}

TODAY'S DATE: ${today}
Use this to determine if launchDate values are in the past or future. Dates on or before today are valid.

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
${filesContext}${urlContext}${conversationContext}

## Your Task
BE PROACTIVE and FLEXIBLE - fix things yourself whenever possible!

IMPORTANT: Any files you put in "fixedFiles" will be AUTOMATICALLY PUSHED to the PR branch!
This means you can directly fix issues without asking the contributor to do it manually.

UNDERSTAND INTENT: Contributors are not developers. They'll give you info conversationally.
- If they tell you something → use it to fix the file
- If they ask you to do something → do it
- If they're vague → make a reasonable choice based on URL content and context
- Don't be literal - understand what they MEAN, not just what they SAY

1. Check each file against the schema
2. **VERIFY URLs** using the URL Verification Results above:
   - Is the site accessible? (✅ = good, ❌ = problem, ⏱️ = maybe slow)
   - Does the site title/content match the project name?
   - Does it look like a legit punk project or a scam?
   - If URLs are dead or suspicious → flag it!
3. Common issues to FIX (don't just report - provide the fix):
   - Empty description → FIRST check the URL content above! Extract a description from the site and use it. Only ask if URL content doesn't help.
   - Wrong date format → convert to YYYY-MM-DD
   - creators as strings → convert to numbers
   - Missing tags → suggest relevant ones based on the project AND URL content
   - Typos in field names → fix them
   - If contributor provides info in comments → UPDATE THE FILE with that info!
   - If contributor says "check the site" or similar → USE THE URL CONTENT to fill missing fields!
4. If the PR looks good → mark as ready for human review
5. If there are issues you can fix → provide the COMPLETE fixed file in fixedFiles (it will be pushed!)
6. If contributor gives you info conversationally (e.g., "the description is X") → add it to fixedFiles!

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
- "ready_for_review": Everything looks good (valid schema + URLs are accessible + content looks legit)
- "needs_changes": The contributor needs to fix something (validation errors, missing info)
- "suspicious": Something looks off - USE THIS IF:
  - URL returns error/timeout and looks intentionally fake
  - Site content doesn't match project name (impersonation)
  - Site looks like a scam, phishing, or malware
  - Explain in suspiciousReasons!
- "needs_info": You need more information from the contributor to proceed

RULES:
- Keep summary SHORT - this is not an essay
- If you can fix it, fix it - don't ask
- fixedFiles must contain the COMPLETE file content (frontmatter + body)
- fixedFiles will be AUTOMATICALLY COMMITTED to the PR - use this power wisely!
- When someone tells you info in conversation, UPDATE the file via fixedFiles
- You NEVER approve or merge - you only prepare for human review
- Be friendly but concise - respect people's time`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
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

export function formatComment(
  result: ReviewResult,
  pushResult?: { success: boolean; commitUrl?: string; error?: string } | null
): string {
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

  // Show fix status
  if (result.fixedFiles.length > 0) {
    if (pushResult?.success) {
      lines.push(
        "### ✨ Fixes Applied",
        "I've automatically updated your files with the fixes!",
        pushResult.commitUrl ? `[View commit](${pushResult.commitUrl})` : "",
        ""
      );
    } else if (pushResult?.error) {
      lines.push(
        "### 🔧 Suggested Fixes",
        `*I couldn't push the fixes automatically (${pushResult.error}). Please copy these to your files:*`,
        ""
      );
      for (const f of result.fixedFiles) {
        lines.push(`<details><summary><code>${f.filename}</code></summary>`, "", "```markdown", f.content, "```", "</details>", "");
      }
    } else {
      lines.push("### 🔧 Suggested Fixes", "*Copy these fixes to your files:*", "");
      for (const f of result.fixedFiles) {
        lines.push(`<details><summary><code>${f.filename}</code></summary>`, "", "```markdown", f.content, "```", "</details>", "");
      }
    }
  }

  return lines.join("\n");
}

// Check if the bot should skip reviewing this PR
// Skip only if the bot was the last commenter (waiting for user response)
// If user commented after bot, bot should respond
function shouldSkipReview(comments: GitHubComment[]): boolean {
  const botLogin = `${GITHUB_APP_SLUG}[bot]`;

  if (comments.length === 0) {
    return false; // No comments, should review
  }

  // Find the last comment
  const lastComment = comments[comments.length - 1];

  // Skip only if the bot was the last commenter
  return lastComment.user.login === botLogin;
}

// Review a single PR
export async function reviewPR(prNumber: number, forceReview = false): Promise<{ reviewed: boolean; reason?: string; fixesPushed?: boolean }> {
  const comments = await getPRComments(prNumber);

  if (!forceReview && shouldSkipReview(comments)) {
    return { reviewed: false, reason: "waiting_for_user" };
  }

  const [details, files] = await Promise.all([getPRDetails(prNumber), getPRFiles(prNumber)]);

  if (files.length === 0) {
    return { reviewed: false, reason: "no_content_files" };
  }

  const result = await analyzeWithClaude(details, files, comments);

  // If there are fixed files, push them to the PR branch
  let fixesPushed = false;
  let pushResult: { success: boolean; commitUrl?: string; error?: string } | null = null;

  if (result.fixedFiles.length > 0) {
    pushResult = await pushFixesToPR(prNumber, result.fixedFiles);
    fixesPushed = pushResult.success;
  }

  // Post comment with the review (and info about pushed fixes)
  await postComment(prNumber, formatComment(result, pushResult));

  return { reviewed: true, fixesPushed };
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
