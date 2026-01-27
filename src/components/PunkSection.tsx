import Link from "next/link";
import { Punk } from "@/types";
import { PunkAvatar } from "./PunkAvatar";
import { ProjectCard } from "./ProjectCard";

interface PunkSectionProps {
  punk: Punk;
}

export function PunkSection({ punk }: PunkSectionProps) {
  return (
    <section className="py-10">
      {/* Punk Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/${punk.id}`} className="group">
          <PunkAvatar
            punkId={punk.id}
            size={64}
            className="transition-all group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[4px_4px_0_0_var(--foreground)]"
          />
        </Link>
        <div>
          <Link href={`/${punk.id}`} className="group">
            <h2 className="text-xl font-bold uppercase tracking-wider group-hover:text-punk-pink">
              {punk.name || `Punk #${punk.id}`}
            </h2>
          </Link>
          <div className="flex items-center gap-3 text-sm font-medium opacity-60">
            <Link
              href={`/${punk.id}`}
              className="hover:text-punk-blue hover:opacity-100"
            >
              #{punk.id}
            </Link>
            {punk.twitter && (
              <a
                href={`https://x.com/${punk.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-punk-pink hover:opacity-100"
              >
                @{punk.twitter}
              </a>
            )}
          </div>
        </div>
        <div className="ml-auto">
          <span className="pixel-tag pixel-tag-blue">
            {punk.projects.length} project
            {punk.projects.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {punk.projects.map((project) => (
          <ProjectCard key={project.id} project={project} punkId={punk.id} />
        ))}
      </div>
    </section>
  );
}
