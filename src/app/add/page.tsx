import { Metadata } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Markdown from "react-markdown";
import { Header, Footer } from "@/components";

export const metadata: Metadata = {
  title: "Add Your Project | Made by Punks",
  description:
    "Learn how to add your punk profile and projects to the Made by Punks directory. A trustless, community-owned directory.",
};

function getPageContent() {
  const filePath = path.join(process.cwd(), "content/pages/add.md");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContent);
  return content;
}

export default function AddPage() {
  const content = getPageContent();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
