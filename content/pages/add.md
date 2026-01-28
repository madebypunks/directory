---
title: Add Your Project
---

# Made by Punks

A trustless, community-owned directory.

---

## The Punk Spirit

CryptoPunks belong to no one and everyone. They are a piece of internet history, a cultural artifact that sparked a movement. This directory exists to celebrate the builders who keep that spirit alive.

**Made by Punks is not a company.** There is no team, no token, no roadmap. It's a public good maintained by the community, for the community.

- **Trustless** - All data lives in markdown files on GitHub. No database, no backend, no single point of failure.
- **Permissionless** - Anyone can add their punk profile and projects via pull request.
- **Decentralized** - Fork it, remix it, make it your own. The code is MIT licensed.
- **Community-owned** - Maintainers are punk holders who volunteer their time.

This is lore that belongs to everyone. Take it and build.

---

## Add Your Punk Profile

Every punk can have their own page - like MySpace, but on-chain adjacent.

### 1. Fork the Repository

Go to [github.com/madebypunks/directory](https://github.com/madebypunks/directory) and fork the repo.

### 2. Create Your Punk File

Create a file `content/punks/[YOUR_PUNK_ID].md`

For example, if you own Punk #1234:

```
content/punks/1234.md
```

### 3. Add Your Profile

Write your markdown file:

```md
---
name: Your Name
twitter: your_handle
website: https://your-site.com
---

Write anything you want here! This is your MySpace page.

Share your story, your vision, your memes. Use markdown to format your content however you like.
```

**Available fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Your display name |
| `twitter` | No | Twitter/X handle (without @) |
| `website` | No | Your personal website |

The content below the `---` is your bio. Go wild.

---

## Add Your Projects

Each project gets its own markdown file in `content/projects/`.

### Create a Project File

Create `content/projects/your-project-slug.md`:

> **Important:** The filename becomes the URL slug (e.g., `/p/your-project-slug`). Make sure it's unique!

```md
---
name: My Project
description: A brief description of what it does.
thumbnail: /projects/my-project.png
url: https://my-project.com
launchDate: 2024-01-15
tags:
  - Tool
  - Art
creators:
  - 1234
twitter: project_handle
github: https://github.com/user/repo
discord: https://discord.gg/invite
---

Optional longer description here. Use markdown for formatting.

## Features

- Feature one
- Feature two
- Feature three
```

**Available fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Project name |
| `description` | Yes | Short description (1-2 sentences) |
| `url` | Yes | Project URL |
| `launchDate` | Yes | Launch date (YYYY-MM-DD) |
| `tags` | Yes | Array of tags |
| `creators` | Yes | Array of punk IDs who built this |
| `thumbnail` | No | Path to image (use `/projects/filename.png`) |
| `twitter` | No | Project's Twitter handle |
| `github` | No | GitHub repo URL |
| `discord` | No | Discord invite URL |
| `hidden` | No | Set to `true` to hide from listings |
| `ded` | No | Set to `true` if project is dead/discontinued |

### Multiple Creators

Projects can have multiple creators! Just list all the punk IDs:

```yaml
creators:
  - 8070  # Matt Hall
  - 5072  # John Watkinson
```

The project will appear on both punk profile pages.

### Add a Thumbnail

For best results, add your project thumbnail to `public/projects/`:

```
public/projects/my-project.png
```

Then reference it in your frontmatter:

```yaml
thumbnail: /projects/my-project.png
```

Recommended size: 1200x630px (OG image dimensions).

---

## Submit Your PR

1. Commit your changes
2. Push to your fork
3. Open a pull request to the main repo
4. A maintainer will review and merge

**That's it.** No forms, no approvals, no gatekeepers. Just git.

---

## Become a Maintainer

Want to help review PRs and keep the directory running?

Open an issue on GitHub with the title "Maintainer Request" and include:

- Your punk ID
- Your Twitter/X handle
- Why you want to help

Maintainers are punk holders who volunteer to review contributions and keep the spam out. No special privileges, just responsibility.

---

## Project Structure

```
madebypunks/
├── content/
│   ├── pages/              # Static pages (like this one)
│   │   └── add.md
│   ├── punks/              # Punk profiles
│   │   ├── 2113.md
│   │   └── 8070.md
│   └── projects/           # Project files
│       ├── punkcam.md
│       └── cryptopunks-app.md
├── public/
│   └── projects/           # Project thumbnails
├── src/
│   ├── app/                # Next.js routes
│   ├── components/         # React components
│   ├── data/               # Data loading
│   └── types/              # TypeScript types
└── README.md
```

---

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **gray-matter** - YAML frontmatter parsing
- **react-markdown** - Markdown rendering

---

## Questions?

Open an issue on [GitHub](https://github.com/madebypunks/directory/issues).

Let's build.
