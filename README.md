# Made by Punks

A trustless, community-owned directory of projects built by CryptoPunks holders.

## Philosophy

CryptoPunks belong to no one and everyone. This directory exists to celebrate the builders who keep the punk spirit alive.

**Made by Punks is not a company.** There is no team, no token, no roadmap. It's a public good maintained by the community, for the community.

- **Trustless** - All data lives in markdown files. No database, no backend, no single point of failure.
- **Permissionless** - Anyone can add their punk profile and projects via pull request.
- **Decentralized** - Fork it, remix it, make it your own. The code is MIT licensed.
- **Community-owned** - Maintainers are punk holders who volunteer their time.

This is lore that belongs to everyone.

## Project Structure

```
madebypunks/
├── content/
│   ├── pages/                    # Static pages (markdown)
│   │   └── add.md                # "Add Your Project" page content
│   ├── punks/                    # Punk profiles
│   │   ├── 2113.md               # One file per punk
│   │   ├── 8070.md
│   │   └── ...
│   └── projects/                 # Projects
│       ├── punkcam.md            # One file per project
│       ├── cryptopunks-app.md
│       └── ...
├── public/
│   └── projects/                 # Project thumbnail images
├── src/
│   ├── app/                      # Next.js App Router pages
│   ├── components/               # React components
│   ├── data/
│   │   └── punks.ts              # Data loader (reads content/ at build time)
│   ├── lib/                      # Utilities & constants
│   └── types/                    # TypeScript types
└── README.md
```

## How It Works

1. All punk and project data is stored as **markdown files** in `content/punks/` and `content/projects/`
2. At build time, `src/data/punks.ts` reads all markdown files and parses the YAML frontmatter
3. Pages are statically generated for each punk and project
4. No database, no API, no runtime data fetching

## Add Your Punk Profile

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/madebypunks.git
cd madebypunks
```

### 2. Create Your Punk File

Create `content/punks/YOUR_PUNK_ID.md`:

```md
---
name: Your Name
twitter: your_handle
website: https://your-site.com
---

Write anything you want here. This is your MySpace page.

Share your story, your vision, whatever. Markdown is supported.
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Display name |
| `twitter` | No | Twitter/X handle (without @) |
| `website` | No | Personal website URL |

The content below the frontmatter is your bio - write whatever you want!

### 3. Add Your Projects

Create `content/projects/your-project-slug.md`:

> **Important:** The filename becomes the URL slug. Make sure it's unique!

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
  - 2113
  - 5072
twitter: project_handle
github: https://github.com/user/repo
discord: https://discord.gg/invite
---

Optional longer description in markdown. Tell the story of your project!
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Project name |
| `description` | Yes | Short description (1-2 sentences) |
| `url` | Yes | Project URL |
| `launchDate` | Yes | Launch date (YYYY-MM-DD) |
| `tags` | Yes | Array of tags |
| `creators` | Yes | Array of punk IDs who built this |
| `thumbnail` | No | Path to thumbnail (e.g., `/projects/my-project.png`) |
| `twitter` | No | Project's Twitter handle |
| `github` | No | GitHub repository URL |
| `discord` | No | Discord invite URL |
| `hidden` | No | Set to `true` to hide from listings |
| `ded` | No | Set to `true` if the project is dead/discontinued |

### 4. Add Thumbnail (Optional)

Place your project image in `public/projects/`:

```bash
public/projects/my-project.png
```

Recommended size: **1200x630px** (OG image dimensions).

### 5. Submit PR

```bash
git add .
git commit -m "Add Punk #1234 and projects"
git push origin main
```

Then open a pull request. A maintainer will review and merge.

## Multiple Creators

Projects can have multiple creators! Just add all the punk IDs:

```yaml
creators:
  - 8070  # Matt Hall
  - 5072  # John Watkinson
```

The project will appear on both punk profile pages.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Become a Maintainer

Want to help review PRs?

Open an issue titled **"Maintainer Request"** with:

- Your punk ID
- Your Twitter/X handle
- Why you want to help

Maintainers review contributions and keep spam out. No special privileges, just responsibility.

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS v4](https://tailwindcss.com/) - Styling
- [gray-matter](https://github.com/jonschlinkert/gray-matter) - YAML frontmatter parsing
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering

## Colors

Official CryptoPunks palette:

- **Punk Blue:** `#638696`
- **Punk Pink:** `#ff69b4`

## Deploy

Deploy your own instance on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/madebypunks/directory)

## License

MIT - Do whatever you want with it.
