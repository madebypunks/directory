import Link from "next/link";
import { Project, Punk } from "@/types";
import { ProjectThumbnail } from "./ProjectThumbnail";
import { PunkAvatar } from "./PunkAvatar";

interface ProjectListItemProps {
  project: Project;
  collaborators?: Punk[];
  size?: "compact" | "default";
}

export function ProjectListItem({ project, collaborators, size = "compact" }: ProjectListItemProps) {
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

        {/* Collaborators */}
        {collaborators && collaborators.length > 0 && (
          <div className="mt-1 flex items-center gap-2 text-sm opacity-70">
            <span>with</span>
            <div className="flex items-center gap-1.5">
              {collaborators.map((collab) => (
                <span key={collab.id} className="flex items-center gap-1">
                  <PunkAvatar punkId={collab.id} size={16} />
                  <span className="font-medium">{collab.name || `#${collab.id}`}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <p className={`mt-1 opacity-70 leading-snug ${isDefault ? 'text-sm sm:text-base line-clamp-2' : 'text-sm sm:text-base line-clamp-1 sm:line-clamp-2'}`}>
          {project.description}
        </p>
      </div>
    </Link>
  );
}
