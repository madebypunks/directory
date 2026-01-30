"use client";

import Markdown from "react-markdown";
import { PunkLink } from "./PunkLink";

interface MarkdownContentProps {
  children: string;
  className?: string;
}

// Custom link component that renders PunkLink for punk URLs
function CustomLink({
  href,
  children,
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  // Check if this is a punk link (e.g., /1477 or punk:1477)
  if (href) {
    // Match /NUMBER or punk:NUMBER
    const punkMatch = href.match(/^(?:punk:|\/)(\d+)$/);
    if (punkMatch) {
      const punkId = parseInt(punkMatch[1], 10);
      // Use children as name if it's a string and not just the ID
      const name = typeof children === "string" && !/^#?\d+$/.test(children)
        ? children
        : undefined;
      return <PunkLink punkId={punkId} name={name} />;
    }
  }

  // Regular link
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function MarkdownContent({ children, className = "" }: MarkdownContentProps) {
  return (
    <div className={className}>
      <Markdown
        components={{
          a: CustomLink,
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
