import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-4 border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 bg-punk-bg" />
          <span className="text-lg font-bold uppercase tracking-wider">
            {SITE_NAME}
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-bold uppercase tracking-wider transition-colors hover:text-punk-blue"
          >
            Projects
          </Link>
          <Link
            href="/add"
            className="pixel-btn px-4 py-2 text-xs"
          >
            + Add Project
          </Link>
        </nav>
      </div>
    </header>
  );
}
