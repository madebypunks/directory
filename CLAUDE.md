# CLAUDE.md

This file provides context about the madebypunks project for AI assistants.

## Project Overview

**Made by Punks** is a trustless, community-owned directory for CryptoPunks holders. It's a public good allowing punk holders to create profiles, showcase projects, and collaborate. No database, no backend—just static markdown files in git.

## Tech Stack

- **Next.js 16** with App Router
- **React 19** + **TypeScript 5**
- **Tailwind CSS v4**
- **gray-matter** for YAML frontmatter parsing
- **react-markdown** for content rendering
- **Octokit** + GitHub App for PR automation
- **Anthropic Claude** for AI moderation (PunkMod)

## Project Structure

```
content/
├── punks/{punkId}.md      # Punk profiles (e.g., 2113.md)
└── projects/{slug}.md     # Project pages (e.g., punkcam.md)

src/
├── app/                   # Next.js pages & API routes
│   ├── [id]/              # Dynamic punk profile pages
│   ├── p/[slug]/          # Dynamic project pages
│   ├── api/mod/           # PunkMod AI endpoints
│   └── ...
├── components/            # React components
├── data/punks.ts          # Build-time content loader
├── lib/                   # Utilities (constants, github, fonts)
└── types/                 # TypeScript interfaces
```

## Content Formats

### Punk Profile (`content/punks/{punkId}.md`)
```yaml
---
name: Holder Name         # Optional
links:
  - https://x.com/handle
---

Bio and description in markdown...
```

### Project (`content/projects/{slug}.md`)
```yaml
---
name: Project Name
description: Short description (1-2 sentences)
thumbnail: /projects/image.png
url: https://project.com
launchDate: 2024-01-01
tags: [Tag1, Tag2]
creators: [2113, 5072]    # Punk IDs
featured: false           # Optional
hidden: false             # Optional
ded: false               # Discontinued flag
---

Detailed markdown description...
```

## Key Patterns

1. **Build-time data loading**: All content parsed at build via `src/data/punks.ts`
2. **Static generation**: Pages pre-rendered using `generateStaticParams()`
3. **No database**: Content stored as markdown in git
4. **PR-based contributions**: Users submit via pull requests
5. **AI moderation**: PunkMod reviews PRs for format, links, spam

## Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm lint     # Run ESLint
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage |
| `/[id]` | Punk profile (e.g., /2113) |
| `/p/[slug]` | Project page (e.g., /p/punkcam) |
| `/who` | Directory of all punks |
| `/add` | Submission instructions |
| `/api/mod` | PunkMod review endpoint |

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_APP_ID=...
GITHUB_APP_INSTALLATION_ID=...
GITHUB_APP_PRIVATE_KEY=...
GITHUB_WEBHOOK_SECRET=...
```

## Design System

- **Punk Blue**: `#638696`
- **Punk Pink**: `#ff69b4`
- **Fonts**: Geist (sans), Geist Mono, Silkscreen (pixel)

## Deployment

Deployed on Vercel. Push to main triggers automatic build and deploy.
