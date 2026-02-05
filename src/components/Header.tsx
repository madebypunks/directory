import Link from "next/link";
import { HiUsers } from "react-icons/hi";
import { SITE_NAME } from "@/lib/constants";
import { SearchOverlay } from "./SearchOverlay";
import { getSearchData } from "@/data/punks";
import { AuthButton } from "./auth";
import { AddLink } from "./AddLink";

export function Header() {
  const searchItems = getSearchData();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground/10 bg-background backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold uppercase tracking-wider font-pixel">
            {SITE_NAME}
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <SearchOverlay items={searchItems} />
          <Link
            href="/who"
            className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5 transition-colors"
            title="Who"
          >
            <HiUsers className="w-5 h-5" />
          </Link>
          <AddLink />
          <div className="ml-2">
            <AuthButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
