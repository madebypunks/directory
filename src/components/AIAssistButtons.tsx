"use client";

const PROMPT = `You are helping a user submit their work to Made by Punks (madebypunks.co), a community directory of CryptoPunks-related projects.

Here are the submission guidelines:

## What Counts?
Anything that explores, celebrates, or builds on CryptoPunks:
- Art - Derivatives, remixes, animations, illustrations inspired by punks
- Writing - Books, essays, zines about punk culture and history
- Film - Documentaries, videos about the punk community
- Music - Soundtracks, albums inspired by punk aesthetics
- Physical goods - Prints, merch, collectibles featuring punks
- Tools - Apps, explorers, utilities for the punk community
- Community projects - Events, collabs, initiatives around punks

## File Format
The user needs to create a markdown file with this format:

\`\`\`
---
name: Work Name
description: A brief description (1-2 sentences)
url: https://project-url.com
launchDate: 2024-01-15
tags:
  - Art
  - Book
creators:
  - 1234
links:
  - https://x.com/handle
  - https://github.com/repo
---

Optional longer description here.
\`\`\`

**Available tags:** Art, Book, Film, Documentary, Music, Photography, Animation, Illustration, Derivative, Generative, History, Guide, Education, Creation, Memes, Fun, Playful, Community, Collector, Marketplace, Explorer, Archive

## For Punk Profiles
If they want their own page, they can create a punk profile:

\`\`\`
---
name: Their Name
links:
  - https://x.com/handle
  - https://their-site.com
---

Bio or description here.
\`\`\`

---

Now, help the user create their submission. Ask them about:
1. Their punk ID
2. What they created (name, description)
3. Website/links
4. When it launched
5. What tags fit best

Then generate the markdown file they can submit via GitHub PR or paste into a form.`;

interface AIAssistButtonsProps {
  className?: string;
}

export function AIAssistButtons({ className = "" }: AIAssistButtonsProps) {
  const encodedPrompt = encodeURIComponent(PROMPT);

  const aiProviders = [
    {
      name: "Claude",
      url: `https://claude.ai/new?q=${encodedPrompt}`,
      color: "bg-[#D97706]",
      hoverColor: "hover:bg-[#B45309]",
    },
    {
      name: "ChatGPT",
      url: `https://chatgpt.com/?q=${encodedPrompt}`,
      color: "bg-[#10A37F]",
      hoverColor: "hover:bg-[#0D8A6A]",
    },
  ];

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <p className="opacity-70">
        Need help? Open with an AI assistant:
      </p>
      <div className="flex flex-wrap gap-3">
        {aiProviders.map((provider) => (
          <a
            key={provider.name}
            href={provider.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2 text-white font-medium transition-colors ${provider.color} ${provider.hoverColor}`}
          >
            Open with {provider.name}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
