import Link from "next/link";
import { Project } from "@/types";
import { ProjectThumbnail } from "./ProjectThumbnail";
import { XIcon, GitHubIcon, DiscordIcon } from "./icons";

interface ProjectCardProps {
  project: Project;
  punkId: number;
  showPunk?: boolean;
}

export function ProjectCard({
  project,
  punkId,
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
    <article className="pixel-card group flex flex-col overflow-hidden">
      {/* Thumbnail */}
      <Link
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video overflow-hidden border-b-4 border-foreground bg-punk-blue"
      >
        <ProjectThumbnail
          projectUrl={project.url}
          projectName={project.name}
          thumbnail={project.thumbnail}
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-bold uppercase tracking-wide">
            <Link
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-punk-pink"
            >
              {project.name}
            </Link>
          </h3>
          <time
            dateTime={project.launchDate}
            className="shrink-0 text-xs font-medium opacity-60"
          >
            {formattedDate}
          </time>
        </div>

        <p className="mb-4 flex-1 text-sm opacity-80">{project.description}</p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {project.tags.map((tag, i) => (
            <span
              key={tag}
              className={`pixel-tag ${i % 2 === 0 ? "pixel-tag-blue" : "pixel-tag-pink"}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-4 border-t-2 border-foreground pt-3">
          {showPunk && (
            <Link
              href={`/punks/${punkId}`}
              className="text-xs font-bold uppercase tracking-wider hover:text-punk-blue"
            >
              #{punkId}
            </Link>
          )}
          {project.twitter && (
            <a
              href={`https://x.com/${project.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 transition-opacity hover:opacity-100"
              aria-label="Twitter"
            >
              <XIcon className="h-4 w-4" />
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 transition-opacity hover:opacity-100"
              aria-label="GitHub"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
          )}
          {project.discord && (
            <a
              href={project.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 transition-opacity hover:opacity-100"
              aria-label="Discord"
            >
              <DiscordIcon className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
