import { Punk, Project } from "@/types";
import { PunkAvatar } from "./PunkAvatar";
import { ProjectListItem } from "./ProjectListItem";
import Link from "next/link";

interface PunkSectionProps {
  punks: Punk[];
  projects: Project[];
  isFirst?: boolean;
}

export function PunkSection({ punks, projects, isFirst = false }: PunkSectionProps) {
  return (
    <section className="py-6">
      {/* Punk Header - Sticky */}
      <div className={`sticky top-[63px] z-10 bg-white dark:bg-neutral-900 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 shadow-[0_8px_16px_-4px_rgba(255,255,255,1)] dark:shadow-[0_8px_16px_-4px_rgba(23,23,23,1)] ${isFirst ? '' : 'border-t border-foreground/10'}`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Punks - inline on all screens */}
          <div className="flex items-center gap-4 flex-wrap">
            {punks.map((punk) => (
              <div key={punk.id} className="flex items-center">
                <Link
                  href={`/${punk.id}`}
                  className="group flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <PunkAvatar punkId={punk.id} size={32} />
                  <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-wide group-hover:text-punk-pink transition-colors">
                      {punk.name || `Punk`}
                    </span>
                    <span className="opacity-50">
                      #{punk.id}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Project count */}
          <span className="ml-auto font-medium opacity-50 whitespace-nowrap">
            {projects.length} work{projects.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Projects List */}
      <div className="mt-2">
        {projects.map((project) => (
          <ProjectListItem key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
