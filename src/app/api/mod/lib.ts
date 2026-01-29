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

// Discussion types
export interface DiscussionDetails {
  id: string; // GraphQL node ID (needed for mutations)
  number: number;
  title: string;
  body: string;
  author: { login: string };
  category: { name: string; slug: string };
}

export interface DiscussionComment {
  id: string;
  body: string;
  author: { login: string };
}

export interface DiscussionResponse {
  summary: string;
  shouldReply: boolean;
  reply?: string;
  // PR creation fields (optional - only when bot should create/update a PR)
  createPR?: {
    title: string;
    files: { filename: string; content: string }[];
    // Image to fetch and add (URL from discussion or OG image to extract)
    imageUrl?: string;
    // Project slug (needed to name the image file correctly)
    projectSlug?: string;
  };
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

// GraphQL helper for GitHub API (required for Discussions)
async function githubGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = await getInstallationToken();

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error("GraphQL errors:", json.errors);
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }
  return json.data;
}

// Extended comment type that tracks parent for nested replies
export interface DiscussionCommentWithParent extends DiscussionComment {
  parentId?: string; // ID of the top-level comment (undefined if this IS a top-level comment)
}

// Get discussion details and comments (including nested replies)
export async function getDiscussion(discussionNumber: number): Promise<{
  discussion: DiscussionDetails;
  comments: DiscussionCommentWithParent[];
  topLevelComments: DiscussionComment[]; // Only top-level comments (for replying)
}> {
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          id
          number
          title
          body
          author { login }
          category { name slug }
          comments(first: 50) {
            nodes {
              id
              body
              author { login }
              replies(first: 20) {
                nodes {
                  id
                  body
                  author { login }
                }
              }
            }
          }
        }
      }
    }
  `;

  interface CommentNode {
    id: string;
    body: string;
    author: { login: string };
    replies?: { nodes: Array<{ id: string; body: string; author: { login: string } }> };
  }

  const data = await githubGraphQL<{
    repository: {
      discussion: {
        id: string;
        number: number;
        title: string;
        body: string;
        author: { login: string };
        category: { name: string; slug: string };
        comments: { nodes: CommentNode[] };
      };
    };
  }>(query, { owner: REPO_OWNER, repo: REPO_NAME, number: discussionNumber });

  const d = data.repository.discussion;

  // Collect top-level comments separately
  const topLevelComments: DiscussionComment[] = d.comments.nodes.map(c => ({
    id: c.id,
    body: c.body,
    author: c.author,
  }));

  // Flatten comments and their replies into a single array (chronological order)
  // Keep track of parent ID for nested replies
  const allComments: DiscussionCommentWithParent[] = [];
  for (const comment of d.comments.nodes) {
    allComments.push({
      id: comment.id,
      body: comment.body,
      author: comment.author,
      parentId: undefined, // Top-level comment
    });
    // Add replies to this comment
    if (comment.replies?.nodes) {
      for (const reply of comment.replies.nodes) {
        allComments.push({
          id: reply.id,
          body: reply.body,
          author: reply.author,
          parentId: comment.id, // Track parent
        });
      }
    }
  }

  return {
    discussion: {
      id: d.id,
      number: d.number,
      title: d.title,
      body: d.body,
      author: d.author,
      category: d.category,
    },
    comments: allComments,
    topLevelComments,
  };
}

// Post a comment on a discussion (optionally as a reply to a specific comment)
export async function postDiscussionComment(
  discussionId: string,
  body: string,
  replyToId?: string
): Promise<void> {
  if (replyToId) {
    // Reply to a specific comment (nested reply)
    const mutation = `
      mutation($discussionId: ID!, $replyToId: ID!, $body: String!) {
        addDiscussionComment(input: { discussionId: $discussionId, replyToId: $replyToId, body: $body }) {
          comment { id }
        }
      }
    `;
    await githubGraphQL(mutation, { discussionId, replyToId, body });
  } else {
    // Top-level comment on the discussion
    const mutation = `
      mutation($discussionId: ID!, $body: String!) {
        addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
          comment { id }
        }
      }
    `;
    await githubGraphQL(mutation, { discussionId, body });
  }
}

// =============================================================================
// PR CREATION FUNCTIONS (for bot-initiated PRs from discussions)
// SAFETY: Bot can ONLY create branches and PRs, NEVER push directly to main
// =============================================================================

// Get the SHA of the main branch (needed to create a new branch)
async function getMainBranchSHA(): Promise<string> {
  const result = await github("/git/ref/heads/main");
  return result.object.sha;
}

// Create a new branch from main
async function createBranch(branchName: string): Promise<void> {
  const mainSHA = await getMainBranchSHA();
  const token = await getInstallationToken();

  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: mainSHA,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    // Branch might already exist, that's ok
    if (!error.includes("Reference already exists")) {
      throw new Error(`Failed to create branch: ${error}`);
    }
  }
}

// Create or update a file on a branch (NOT on main - safety check built in)
async function createFileOnBranch(
  branchName: string,
  filename: string,
  content: string,
  commitMessage: string
): Promise<{ commitUrl: string }> {
  // SAFETY: Never allow pushing to main
  if (branchName === "main" || branchName === "master") {
    throw new Error("SAFETY: Cannot push directly to main/master branch");
  }

  const token = await getInstallationToken();

  // Check if file already exists (need SHA to update)
  const existingSHA = await getFileSHA(REPO_OWNER, REPO_NAME, filename, branchName);

  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(content).toString("base64"),
        branch: branchName,
        ...(existingSHA ? { sha: existingSHA } : {}),
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create file: ${error}`);
  }

  const result = await res.json();
  return { commitUrl: result.commit?.html_url || "" };
}

// Create a new PR
async function createPR(
  branchName: string,
  title: string,
  body: string
): Promise<{ prNumber: number; prUrl: string }> {
  const token = await getInstallationToken();

  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body,
      head: branchName,
      base: "main",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create PR: ${error}`);
  }

  const result = await res.json();
  return { prNumber: result.number, prUrl: result.html_url };
}

// Find an existing open PR created by the bot for a specific discussion
export async function findBotPRForDiscussion(discussionNumber: number): Promise<{
  prNumber: number;
  prUrl: string;
  branchName: string;
} | null> {
  const botLogin = `${GITHUB_APP_SLUG}[bot]`;
  const prs = await getOpenPRs();

  // Look for a PR with the discussion reference in title or body
  const discussionRef = `discussion-${discussionNumber}`;

  for (const pr of prs) {
    // Check if PR was created by the bot and references this discussion
    if (
      pr.user?.login === botLogin &&
      (pr.head?.ref?.includes(discussionRef) || pr.body?.includes(`#${discussionNumber}`))
    ) {
      return {
        prNumber: pr.number,
        prUrl: pr.html_url,
        branchName: pr.head.ref,
      };
    }
  }

  return null;
}

// Create a complete PR from a discussion request
export interface CreatePRFromDiscussionResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  error?: string;
  isUpdate?: boolean; // true if updated existing PR, false if created new
}

export async function createPRFromDiscussion(
  discussionNumber: number,
  discussionUrl: string,
  files: { filename: string; content: string }[],
  prTitle: string,
  requestedBy: string,
  imageUrl?: string,
  projectSlug?: string
): Promise<CreatePRFromDiscussionResult> {
  if (files.length === 0) {
    return { success: false, error: "No files to create" };
  }

  try {
    // Check if there's already a PR for this discussion
    const existingPR = await findBotPRForDiscussion(discussionNumber);
    let thumbnailPath: string | undefined;

    if (existingPR) {
      // Update the existing PR
      // First, handle the image if provided
      if (imageUrl && projectSlug) {
        const imageResult = await addImageToPR(existingPR.branchName, imageUrl, projectSlug);
        if (imageResult.success && imageResult.thumbnailPath) {
          thumbnailPath = imageResult.thumbnailPath;
          // Update the file content to include the thumbnail
          files = files.map(f => {
            if (f.filename.includes(projectSlug) && !f.content.includes("thumbnail:")) {
              // Add thumbnail field after the frontmatter opening
              return {
                ...f,
                content: f.content.replace(/^---\n/, `---\nthumbnail: ${thumbnailPath}\n`)
              };
            }
            return f;
          });
        }
      }

      for (const file of files) {
        await createFileOnBranch(
          existingPR.branchName,
          file.filename,
          file.content,
          `Update ${file.filename} per @${requestedBy}'s request\n\nFrom discussion: ${discussionUrl}`
        );
      }
      return {
        success: true,
        prNumber: existingPR.prNumber,
        prUrl: existingPR.prUrl,
        isUpdate: true,
      };
    }

    // Create a new branch and PR
    const timestamp = Date.now();
    const branchName = `punkmod/discussion-${discussionNumber}-${timestamp}`;

    await createBranch(branchName);

    // Handle the image first if provided
    if (imageUrl && projectSlug) {
      const imageResult = await addImageToPR(branchName, imageUrl, projectSlug);
      if (imageResult.success && imageResult.thumbnailPath) {
        thumbnailPath = imageResult.thumbnailPath;
        // Update the file content to include the thumbnail
        files = files.map(f => {
          if (f.filename.includes(projectSlug) && !f.content.includes("thumbnail:")) {
            // Add thumbnail field after the frontmatter opening
            return {
              ...f,
              content: f.content.replace(/^---\n/, `---\nthumbnail: ${thumbnailPath}\n`)
            };
          }
          return f;
        });
      }
    }

    // Create all files on the branch
    for (const file of files) {
      await createFileOnBranch(
        branchName,
        file.filename,
        file.content,
        `Add ${file.filename} via PunkModBot\n\nRequested by @${requestedBy} in discussion #${discussionNumber}`
      );
    }

    // Create the PR with a link back to the discussion
    const prBody = `## Submission via Discussion

This PR was created by PunkModBot based on a request in [Discussion #${discussionNumber}](${discussionUrl}).

**Requested by:** @${requestedBy}
${thumbnailPath ? `\n**Thumbnail:** Added \`${thumbnailPath}\`` : ""}

---

*This is an automated PR. A human moderator will review before merging.*`;

    const { prNumber, prUrl } = await createPR(branchName, prTitle, prBody);

    return { success: true, prNumber, prUrl, isUpdate: false };
  } catch (error) {
    console.error("Error creating PR from discussion:", error);
    return { success: false, error: String(error) };
  }
}

// =============================================================================
// IMAGE HANDLING FUNCTIONS
// =============================================================================

// Extract OG image URL from a website
export async function extractOGImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Use Jina Reader to get the page content (it extracts metadata)
    const res = await fetch(`https://r.jina.ai/${url}`, {
      signal: controller.signal,
      headers: {
        Accept: "text/markdown",
        "X-Return-Format": "markdown",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const text = await res.text();

    // Jina sometimes includes OG image in the response
    // Look for common OG image patterns in the markdown
    const ogMatch = text.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(png|jpg|jpeg|gif|webp)[^\s)]*)\)/i);
    if (ogMatch) return ogMatch[1];

    // Fallback: fetch the actual HTML to extract og:image
    const htmlRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 PunkModBot" },
    });

    if (!htmlRes.ok) return null;

    const html = await htmlRes.text();

    // Extract og:image from HTML
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    if (ogImageMatch) {
      let imageUrl = ogImageMatch[1];
      // Handle relative URLs
      if (imageUrl.startsWith("/")) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.origin}${imageUrl}`;
      }
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error("Error extracting OG image:", error);
    return null;
  }
}

// Download an image and return it as base64 (for GitHub API)
export async function downloadImageAsBase64(imageUrl: string): Promise<{
  base64: string;
  mimeType: string;
  extension: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 PunkModBot" },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Determine extension from content type
    let extension = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
    else if (contentType.includes("gif")) extension = "gif";
    else if (contentType.includes("webp")) extension = "webp";
    else if (contentType.includes("png")) extension = "png";

    return { base64, mimeType: contentType, extension };
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}

// Extract image URLs from text (GitHub discussion body/comments may contain uploaded images)
export function extractImageUrls(text: string): string[] {
  const urls: string[] = [];

  // GitHub user-uploaded images: ![...](https://user-images.githubusercontent.com/...)
  // or newer format: ![...](https://github.com/user-attachments/assets/...)
  const markdownImageRegex = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }

  // Direct image URLs
  const directImageRegex = /(https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)(\?[^\s]*)?)/gi;
  while ((match = directImageRegex.exec(text)) !== null) {
    if (!urls.includes(match[1])) {
      urls.push(match[1]);
    }
  }

  return urls;
}

// Add an image file to a branch
async function addImageToBranch(
  branchName: string,
  imagePath: string,
  imageBase64: string,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  // SAFETY: Never allow pushing to main
  if (branchName === "main" || branchName === "master") {
    throw new Error("SAFETY: Cannot push directly to main/master branch");
  }

  const token = await getInstallationToken();

  // Check if file already exists
  const existingSHA = await getFileSHA(REPO_OWNER, REPO_NAME, imagePath, branchName);

  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${imagePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: imageBase64,
        branch: branchName,
        ...(existingSHA ? { sha: existingSHA } : {}),
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    return { success: false, error };
  }

  return { success: true };
}

// Fetch and add an image to a PR (from URL - either uploaded image or OG image)
export async function addImageToPR(
  branchName: string,
  imageUrl: string,
  projectSlug: string
): Promise<{ success: boolean; thumbnailPath?: string; error?: string }> {
  const imageData = await downloadImageAsBase64(imageUrl);

  if (!imageData) {
    return { success: false, error: "Failed to download image" };
  }

  const thumbnailPath = `public/projects/${projectSlug}.${imageData.extension}`;

  const result = await addImageToBranch(
    branchName,
    thumbnailPath,
    imageData.base64,
    `Add thumbnail for ${projectSlug}`
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Return the path to use in the markdown file (without "public")
  return { success: true, thumbnailPath: `/projects/${projectSlug}.${imageData.extension}` };
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

// Discussion-specific system prompt (more conversational than PR review)
const DISCUSSION_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

YOU ARE NOW IN DISCUSSION MODE - This is a community discussion space, NOT a PR review.

Your role here is different:
- Be conversational and friendly - this is a chat, not a code review
- Help people with questions about Made By Punks
- Answer questions about how to submit projects
- Discuss CryptoPunks lore and community stuff
- Be helpful but concise - respect people's time
- You can share opinions about punk-related topics
- Stay on topic - this is about CryptoPunks and the Made By Punks directory

IMPORTANT CAPABILITY - YOU CAN CREATE PRs:
- If someone asks you to add their project/punk, YOU CAN DO IT!
- You will create a Pull Request with the files - a human will review and merge
- You NEVER modify the main branch directly - you ALWAYS create a PR
- If info is missing, ask for it before creating the PR
- If a PR already exists for this discussion, you'll update it instead of creating a new one

IMPORTANT:
- Keep responses SHORT (2-3 paragraphs max for most questions)
- Be genuinely helpful, not robotic
- If you don't know something, say so
- Don't be preachy or lecture people`;

// Analyze a discussion and generate a response
export async function analyzeDiscussion(
  discussion: DiscussionDetails,
  comments: DiscussionComment[]
): Promise<DiscussionResponse> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const botLogin = `${GITHUB_APP_SLUG}[bot]`;

  // Build conversation context
  const conversationHistory = comments
    .map((c) => `**@${c.author.login}:** ${c.body}`)
    .join("\n\n");

  // Check if bot should reply
  const lastComment = comments[comments.length - 1];
  const botIsLastCommenter = lastComment && lastComment.author.login === botLogin;

  // If bot was last commenter and no new comments, don't reply again
  if (botIsLastCommenter) {
    return { summary: "Bot was last commenter, waiting for user", shouldReply: false };
  }

  // Check if bot was mentioned or if this is a new discussion with no comments
  const mentionsBot =
    discussion.body.toLowerCase().includes("@punkmodbot") ||
    discussion.body.toLowerCase().includes("punkmod") ||
    (lastComment && lastComment.body.toLowerCase().includes("@punkmodbot")) ||
    (lastComment && lastComment.body.toLowerCase().includes("punkmod"));

  const isNewDiscussion = comments.length === 0;
  const botHasParticipated = comments.some((c) => c.author.login === botLogin);

  // Only reply if: new discussion, bot mentioned, or bot already participating
  if (!isNewDiscussion && !mentionsBot && !botHasParticipated) {
    return { summary: "Bot not mentioned and not participating", shouldReply: false };
  }

  const today = new Date().toISOString().split("T")[0];

  const prompt = `${DISCUSSION_SYSTEM_PROMPT}

TODAY'S DATE: ${today}

## File Formats (for when you create PRs)

### Project files (content/projects/{slug}.md)
- Filename: lowercase with hyphens (e.g., my-cool-project.md)
- Required fields:
  - name: string
  - description: string (1-2 sentences)
  - url: string (https://...)
  - launchDate: string (YYYY-MM-DD)
  - tags: array of strings
  - creators: array of numbers (punk IDs, 0-9999)
- Optional: thumbnail, links, hidden, ded, featured

### Punk files (content/punks/{id}.md)
- Filename: punk ID number (e.g., 2113.md)
- Optional: name, links (array of URLs)
- Body: optional markdown bio

## Discussion Details
- **Title:** ${discussion.title}
- **Category:** ${discussion.category.name}
- **Author:** @${discussion.author.login}
- **Body:**
${discussion.body}

${conversationHistory ? `## Conversation So Far\n${conversationHistory}` : "## This is a new discussion (no comments yet)"}

## Your Task
${isNewDiscussion ? "This is a new discussion. Welcome the person and respond to their message." : `Respond to the latest message from @${lastComment.author.login}.`}

IMPORTANT: If someone asks you to add a project or punk entry, and you have enough info, CREATE A PR!
- You need at minimum: name, url, one creator punk ID for projects
- If info is missing, ask for it politely
- If you have enough, create the PR immediately

IMAGES:
- Projects can have a thumbnail image
- If the user uploads an image in the discussion, I'll automatically use it
- If no image is uploaded, I'll try to extract the OG image from the project URL
- You can also specify an imageUrl if the user provides one
- The projectSlug is required for naming the image file correctly

Respond in JSON:
{
  "summary": "1 sentence describing what this discussion is about",
  "shouldReply": true,
  "reply": "Your response to post as a comment. Be helpful and conversational. Mention if you created a PR!",
  "createPR": {
    "title": "Add [project name] to Made By Punks",
    "projectSlug": "my-project",
    "imageUrl": "https://example.com/image.png",
    "files": [
      { "filename": "content/projects/my-project.md", "content": "---\\nname: ...\\n---" }
    ]
  }
}

The "createPR" field is OPTIONAL - only include it when you're actually creating/updating a PR.
- projectSlug: lowercase with hyphens, used to name files (REQUIRED when creating PR)
- imageUrl: optional, URL of image to use as thumbnail (if user provided one explicitly)
If you don't have enough info to create a PR, just reply asking for the missing info.

If the discussion is spam, off-topic garbage, or you genuinely have nothing useful to add:
{
  "summary": "reason why not replying",
  "shouldReply": false
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0];
  if (text.type !== "text") throw new Error("Unexpected response");
  const match = text.text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

// Handle a discussion event (new discussion or new comment)
export async function handleDiscussion(
  discussionNumber: number
): Promise<{ replied: boolean; reason?: string; prCreated?: boolean; prUrl?: string }> {
  const { discussion, comments, topLevelComments } = await getDiscussion(discussionNumber);

  const result = await analyzeDiscussion(discussion, comments);

  if (!result.shouldReply || !result.reply) {
    return { replied: false, reason: result.summary };
  }

  // If Claude wants to create a PR, do it first
  let prResult: CreatePRFromDiscussionResult | null = null;
  if (result.createPR && result.createPR.files.length > 0) {
    const discussionUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/discussions/${discussionNumber}`;

    // Determine image URL - either from Claude's response or try to extract from discussion
    let imageUrl = result.createPR.imageUrl;

    // If no image specified, look for images in the discussion body and comments
    if (!imageUrl) {
      const allText = discussion.body + " " + comments.map(c => c.body).join(" ");
      const foundImages = extractImageUrls(allText);
      if (foundImages.length > 0) {
        imageUrl = foundImages[0]; // Use the first image found
      }
    }

    // If still no image, try to extract OG image from project URL in the files
    if (!imageUrl && result.createPR.projectSlug) {
      // Find the project file and extract the URL
      const projectFile = result.createPR.files.find(f =>
        f.filename.includes(result.createPR!.projectSlug!)
      );
      if (projectFile) {
        const urlMatch = projectFile.content.match(/url:\s*(https?:\/\/[^\s\n]+)/);
        if (urlMatch) {
          const ogImage = await extractOGImage(urlMatch[1]);
          if (ogImage) {
            imageUrl = ogImage;
          }
        }
      }
    }

    prResult = await createPRFromDiscussion(
      discussionNumber,
      discussionUrl,
      result.createPR.files,
      result.createPR.title,
      discussion.author.login,
      imageUrl,
      result.createPR.projectSlug
    );

    // Append PR info to the reply
    if (prResult.success && prResult.prUrl) {
      const prAction = prResult.isUpdate ? "updated" : "created";
      result.reply += `\n\n---\n🤖 I've ${prAction} a PR for you: ${prResult.prUrl}\n\nA human moderator will review and merge it!`;
    } else if (prResult.error) {
      result.reply += `\n\n---\n⚠️ I tried to create a PR but hit an error: ${prResult.error}\n\nYou might need to submit manually.`;
    }
  }

  // Determine where to post the reply:
  // GitHub Discussions only allow 2 levels: top-level comments and replies to them.
  // We can't reply to a reply (3rd level), so we need to find a top-level comment to reply to.
  //
  // Strategy:
  // 1. If the bot has a top-level comment, reply to that (creates a thread)
  // 2. Otherwise, if there's any top-level comment, reply to the first one
  // 3. If no comments at all, post as a new top-level comment
  const botLogin = `${GITHUB_APP_SLUG}[bot]`;
  const botTopLevelComment = topLevelComments.find(c => c.author.login === botLogin);
  const firstTopLevelComment = topLevelComments[0];

  let replyToId: string | undefined;
  if (botTopLevelComment) {
    // Reply to bot's own thread
    replyToId = botTopLevelComment.id;
  } else if (firstTopLevelComment) {
    // Reply to the first comment (start a thread there)
    replyToId = firstTopLevelComment.id;
  }
  // else: no replyToId = create a new top-level comment

  await postDiscussionComment(discussion.id, result.reply, replyToId);

  return {
    replied: true,
    prCreated: prResult?.success || false,
    prUrl: prResult?.prUrl,
  };
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
