"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project, Punk } from "@/types";
import { ProjectThumbnail } from "./ProjectThumbnail";
import { PunkLink } from "./PunkLink";

interface ProjectListItemProps {
  project: Project;
  collaborators?: Punk[];
  size?: "compact" | "default";
}

export function ProjectListItem({ project, collaborators, size = "compact" }: ProjectListItemProps) {
  const router = useRouter();

  const formattedDate = new Date(project.launchDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
    }
  );

  const isDefault = size === "default";

  return (
    <Link
      href={`/p/${project.id}`}
      className={`group flex gap-4 hover:bg-foreground/2 transition-colors -mx-2 px-2 rounded ${isDefault ? 'py-4' : 'py-3'}`}
    >
      {/* Thumbnail */}
      <div className={`relative shrink-0 overflow-hidden bg-punk-blue rounded-lg ${isDefault ? 'w-28 h-28 sm:w-32 sm:h-32' : 'w-16 h-16 sm:w-20 sm:h-20'}`}>
        <ProjectThumbnail
          projectUrl={project.url}
          projectName={project.name}
          thumbnail={project.thumbnail}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Title + Date row */}
        <div className="flex items-baseline justify-between gap-4">
          <h3 className={`font-bold leading-tight group-hover:text-punk-pink transition-colors truncate ${isDefault ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
            {project.name}
          </h3>
          <time
            dateTime={project.launchDate}
            className="hidden sm:block text-base font-medium opacity-40 font-mono shrink-0"
          >
            {formattedDate}
          </time>
        </div>

        <p className={`mt-1 opacity-70 leading-snug ${isDefault ? 'text-base line-clamp-2' : 'text-base line-clamp-2'}`}>
          {project.description}
        </p>

        {/* Collaborators */}
        {collaborators && collaborators.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="opacity-50">With</span>
            {collaborators.map((collab) => (
              <PunkLink
                key={collab.id}
                punkId={collab.id}
                name={collab.name}
                size="xs"
                variant="subtle"
                onClick={() => router.push(`/${collab.id}`)}
              />
            ))}
          </div>
        )}

      </div>
    </Link>
  );
}
