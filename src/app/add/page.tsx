import React from "react";
import { Metadata } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Markdown from "react-markdown";
import { Header, Footer, PunkMod } from "@/components";

export const metadata: Metadata = {
  title: "Share Your Work | Made by Punks",
  description:
    "Learn how to add your punk profile and works to the Made by Punks directory. A trustless, community-owned directory.",
};

function getPageContent() {
  const filePath = path.join(process.cwd(), "content/pages/add.md");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContent);
  return content;
}

export default function AddPage() {
  const content = getPageContent();

  const components = {
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) => {
      const text = String(children);
      if (text === "Meet PunkMod") {
        return (
          <>
            <h2 {...props}>{children}</h2>
            <PunkMod size={96} className="my-6 not-prose" />
          </>
        );
      }
      return <h2 {...props}>{children}</h2>;
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none prose-headings:text-punk-blue prose-h1:text-punk-pink prose-h2:text-punk-blue prose-a:text-punk-pink prose-a:no-underline hover:prose-a:underline prose-strong:text-punk-blue prose-hr:border-punk-blue/20">
            <Markdown components={components}>{content}</Markdown>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
