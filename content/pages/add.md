---
title: Add Your Work
---

# Share Your Work

Made by Punks is a directory of works that explore CryptoPunks art and culture. If you hold a punk and you've created something inspired by or related to CryptoPunks, we want to feature it here.

---

## What Counts?

Anything that explores, celebrates, or builds on CryptoPunks.

- **Art** - Derivatives, remixes, animations, illustrations inspired by punks
- **Writing** - Books, essays, zines about punk culture and history
- **Film** - Documentaries, videos about the punk community
- **Music** - Soundtracks, albums inspired by punk aesthetics
- **Physical goods** - Prints, merch, collectibles featuring punks
- **Tools** - Apps, explorers, utilities for the punk community
- **Community projects** - Events, collabs, initiatives around punks

If it's about punks and you made it, it belongs here.

---

## Two Ways to Add Your Work

### Option 1: Fill Out a Form (Easy)

Not comfortable with GitHub? No problem. Fill out [this form](https://github.com/madebypunks/directory/issues/new?template=project-submission.md&title=New+Project:+[Your+Project+Name]) and we'll add your work for you.

Just tell us:
- Your punk ID
- Name of your work
- What it is (a sentence or two)
- Website or link
- Any other links (socials, etc.)
- A thumbnail image (optional)

A maintainer will take it from there.

### Option 2: Submit via GitHub (For Those Who Know Git)

If you're comfortable with GitHub, you can add your work directly:

1. **Fork** the [repository](https://github.com/madebypunks/directory)
2. **Create** a file in `content/projects/your-project.md`
3. **Add** your info (see format below)
4. **Submit** a pull request

That's it. No gatekeepers, no approvals process. Just git.

---

## Meet PunkMod

![PunkMod](https://punks.art/api/traits/003-055-020-052?background=v2&format=png)

When you submit a pull request, **PunkMod** will greet you. PunkMod is our AI assistant that helps contributors get their submissions right.

PunkMod will:
- **Check your files** for missing or incorrect data
- **Verify your URLs** to make sure they work
- **Filter scams and spam** - protects the directory from fake projects and phishing attempts
- **Ensure relevance** - makes sure submissions are actually related to CryptoPunks
- **Suggest fixes** if something needs adjusting
- **Answer questions** - just reply to the bot!

Don't stress about getting everything perfect on your first try. PunkMod is patient and will help you through the process. It's like having a helpful punk friend who knows all the rules and keeps the bad actors out.

> PunkMod prepares submissions for review but never merges anything. A human maintainer always makes the final call.

---

## File Format

```
---
name: Your Work Name
description: A brief description (1-2 sentences)
url: https://your-project.com
launchDate: 2024-01-15
tags:
  - Art
  - Book
creators:
  - 1234
links:
  - https://x.com/your_handle
  - https://github.com/your_repo
  - https://discord.gg/invite
---

Write more about your work here if you want.
```

**Tags to choose from:**
Art, Book, Film, Documentary, Music, Photography, Animation, Illustration, Derivative, Generative, History, Guide, Education, Creation, Memes, Fun, Playful, Community, Collector, Marketplace, Explorer, Archive

---

## Add Your Punk Profile

Want your own page? Create `content/punks/[YOUR_PUNK_ID].md`:

```
---
name: Your Name
links:
  - https://x.com/your_handle
  - https://your-site.com
---

Write anything you want here. This is your space.
```

---

## Collabs Welcome

Works can have multiple creators. List all the punk IDs:

```
creators:
  - 1234
  - 5678
```

The work will appear on both punk pages.

---

## Add a Thumbnail

Drop your image in `public/projects/` and reference it:

```
thumbnail: /projects/your-project.png
```

Keep it around 1200x630px for best results.

---

## The Spirit of This Place

CryptoPunks belong to no one and everyone. This directory is the same.

- **No database** - Everything lives in simple text files
- **No backend** - Just static files, forkable and remix-friendly
- **No gatekeepers** - Anyone can contribute, anyone can fork
- **Community-maintained** - Volunteers who hold punks, nothing more

This is lore that belongs to everyone. Take it and build.

---

## Questions?

Open an issue on [GitHub](https://github.com/madebypunks/directory/issues) or reach out to one of the maintainers.
