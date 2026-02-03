# Made by Punks

A trustless, community-owned directory of CryptoPunks holders.

## What is this?

Made by Punks is a place for punk holders to show who they are, what they do, and what they create around the CryptoPunks lore.

**No project required.** If you hold a punk, you belong here.

## Philosophy

CryptoPunks belong to no one and everyone. This directory celebrates the people behind the punks.

**Made by Punks is not a company.** There is no team, no token, no roadmap. It's a public good maintained by the community, for the community.

- **Trustless** - All data lives in markdown files. No database, no backend, no single point of failure.
- **Permissionless** - Anyone can add their punk profile via pull request.
- **Decentralized** - Fork it, remix it, make it your own. The code is MIT licensed.
- **Community-owned** - Maintainers are punk holders who volunteer their time.

This is lore that belongs to everyone.

## Project Structure

```
madebypunks/
├── content/
│   ├── pages/                    # Static pages (markdown)
│   ├── punks/                    # Punk profiles
│   │   ├── 2113.md               # One file per punk
│   │   └── ...
│   └── projects/                 # Works/Projects (optional)
│       ├── punkcam.md            # One file per project
│       └── ...
├── public/
│   └── projects/                 # Project thumbnail images
├── src/
│   ├── app/                      # Next.js App Router pages
│   ├── components/               # React components
│   ├── data/punks.ts             # Data loader (reads content/ at build time)
│   └── lib/                      # Utilities & constants
└── README.md
```

## How It Works

1. All punk profiles and projects are stored as **markdown files** in `content/`
2. At build time, the data loader reads all files and parses the YAML frontmatter
3. Pages are statically generated for each punk and project
4. No database, no API, no runtime data fetching

## Add Your Profile

### Punk Profile Format

Create `content/punks/YOUR_PUNK_ID.md`:

```md
---
name: Your Name
links:
  - https://x.com/your_handle
  - https://your-site.com
---

Write anything you want here. This is your space.

Share your story, your interests, whatever. Markdown is supported.
```

That's all you need. No project required.

### Project Format (Optional)

If you've built something, create `content/projects/your-project.md`:

```md
---
name: My Project
description: A brief description (1-2 sentences)
url: https://my-project.com
launchDate: 2024-01-15
tags:
  - Art
  - Tool
creators:
  - 2113
thumbnail: /projects/my-project.png
links:
  - https://x.com/project
---

Optional longer description in markdown.
```

**Available tags:** Art, Book, Film, Documentary, Music, Photography, Animation, Illustration, Derivative, Generative, History, Guide, Education, Creation, Memes, Fun, Playful, Community, Collector, Marketplace, Explorer, Archive, Tool

### Submit

```bash
git add .
git commit -m "Add Punk #1234"
git push origin main
```

Then open a pull request.

## PunkMod - Your AI Assistant

<img src="https://punks.art/api/traits/003-055-020-052?background=v2&format=png&size=240" alt="PunkMod" width="96" height="96" />

When you open a pull request or start a discussion, **PunkMod** will help you:

- **Review your files** - Checks if your submission follows the correct format
- **Verify your links** - Makes sure URLs are working and legit
- **Filter spam** - Protects the directory from scams and bad actors
- **Suggest fixes** - If something's wrong, PunkMod tells you what to fix
- **Answer questions** - Chat with PunkMod in discussions or PR comments

PunkMod is here to help. Don't worry if your first submission isn't perfect - PunkMod will guide you through it.

> **Note:** PunkMod never merges PRs. A human maintainer always has the final say.

## Multiple Creators

Projects can have multiple creators:

```yaml
creators:
  - 8070
  - 5072
```

The project will appear on both punk profile pages.

## Development

```bash
npm install    # Install dependencies
npm run dev    # Run development server
npm run build  # Build for production
```

## Become a Maintainer

Want to help review PRs? Join the [discussion](https://github.com/madebypunks/directory/discussions) with:

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
