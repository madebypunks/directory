"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project, Punk } from "@/types";
import { ProjectThumbnail } from "./ProjectThumbnail";
import { PunkAvatar } from "./PunkAvatar";

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

  const handleCollaboratorClick = (e: React.MouseEvent, punkId: number) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/${punkId}`);
  };

  return (
    <Link
      href={`/p/${project.id}`}
      className={`group flex gap-4 hover:bg-foreground/2 transition-colors -mx-2 px-2 rounded ${isDefault ? 'py-4' : 'py-3'}`}
    >
      {/* Thumbnail */}
      <div className={`relative shrink-0 overflow-hidden bg-punk-blue ${isDefault ? 'w-28 h-20 sm:w-36 sm:h-24' : 'w-20 h-14 sm:w-28 sm:h-20'}`}>
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

        <p className={`mt-1 opacity-70 leading-snug ${isDefault ? 'text-base line-clamp-2' : 'text-base line-clamp-1 sm:line-clamp-2'}`}>
          {project.description}
        </p>

        {/* Collaborators */}
        {collaborators && collaborators.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="opacity-50">With</span>
            {collaborators.map((collab) => (
              <span
                key={collab.id}
                onClick={(e) => handleCollaboratorClick(e, collab.id)}
                className="flex items-center whitespace-nowrap bg-foreground/5 hover:bg-foreground/10 border border-transparent hover:border-white/10 transition-colors"
                style={{ height: 20 }}
              >
                <PunkAvatar punkId={collab.id} size={18} />
                <div className="px-1.5 py-0.5 opacity-70">{collab.name || `#${collab.id}`}</div>
              </span>
            ))}
          </div>
        )}

      </div>
    </Link>
  );
}
