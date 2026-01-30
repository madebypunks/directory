import Link from "next/link";
import { Project, Punk } from "@/types";
import { ProjectThumbnail } from "./ProjectThumbnail";
import { PunkLink } from "./PunkLink";
import { LinksList } from "./LinksList";

interface ProjectCardProps {
  project: Project;
  collaborators?: Punk[]; // Other creators to show as "with X"
  showPunk?: boolean;
}

export function ProjectCard({
  project,
  collaborators,
  showPunk = false,
}: ProjectCardProps) {
  const formattedDate = new Date(project.launchDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
    }
  );

  return (
    <article className="pixel-card group flex flex-col overflow-hidden h-full">
      {/* Thumbnail */}
      <Link
        href={`/p/${project.id}`}
        className="relative aspect-video overflow-hidden bg-punk-blue"
      >
        <ProjectThumbnail
          projectUrl={project.url}
          projectName={project.name}
          thumbnail={project.thumbnail}
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="mb-2 text-lg font-bold uppercase tracking-wide leading-tight">
          <Link
            href={`/p/${project.id}`}
            className="hover:text-punk-pink transition-colors"
          >
            {project.name}
          </Link>
        </h3>

        {/* Collaborators */}
        {collaborators && collaborators.length > 0 && (
          <div className="mb-2 flex items-center gap-2">
            <span className="opacity-70">with</span>
            <div className="flex items-center gap-1.5">
              {collaborators.map((collab) => (
                <PunkLink
                  key={collab.id}
                  punkId={collab.id}
                  name={collab.name}
                  size="sm"
                  variant="ghost"
                />
              ))}
            </div>
          </div>
        )}

        <p className="mb-3 flex-1 text-base opacity-80 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Links + Date */}
        <div className="flex items-center gap-3 pt-2 mt-auto">
          {showPunk && project.creators[0] && (
            <Link
              href={`/${project.creators[0]}`}
              className="text-base font-bold uppercase tracking-wider hover:text-punk-blue"
            >
              #{project.creators[0]}
            </Link>
          )}
          {project.links && project.links.length > 0 && (
            <LinksList links={project.links} />
          )}
          <time
            dateTime={project.launchDate}
            className="ml-auto text-base font-medium opacity-50 font-mono"
          >
            {formattedDate}
          </time>
        </div>
      </div>
    </article>
  );
}
