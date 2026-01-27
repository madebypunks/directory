import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { Header, Footer, PunkAvatar, ProjectThumbnail } from "@/components";
import { XIcon, GitHubIcon, DiscordIcon } from "@/components/icons";
import { getProjectById, getAllProjectParams } from "@/data/punks";

interface ProjectPageProps {
  params: Promise<{ id: string; projectId: string }>;
}

export async function generateStaticParams() {
  return getAllProjectParams();
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { id, projectId } = await params;
  const punkId = parseInt(id, 10);
  const project = getProjectById(punkId, projectId);

  if (!project) {
    return {
      title: "Project Not Found | Made by Punks",
    };
  }

  return {
    title: `${project.name} | Made by Punks`,
    description: project.description,
    openGraph: {
      title: `${project.name} | Made by Punks`,
      description: project.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} | Made by Punks`,
      description: project.description,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id, projectId } = await params;
  const punkId = parseInt(id, 10);
  const project = getProjectById(punkId, projectId);

  if (!project) {
    notFound();
  }

  const formattedDate = new Date(project.launchDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Project Header */}
        <section className="border-b-4 border-foreground bg-punk-blue">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Link
              href={`/${punkId}`}
              className="mb-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/80 transition-colors hover:text-white"
            >
              ← Back to Punk #{punkId}
            </Link>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              {/* Thumbnail */}
              <div className="relative aspect-video w-full max-w-md overflow-hidden border-4 border-white lg:w-96">
                <ProjectThumbnail
                  projectUrl={project.url}
                  projectName={project.name}
                  thumbnail={project.thumbnail}
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold uppercase tracking-wider text-white sm:text-4xl">
                  {project.name}
                </h1>
                <p className="mt-2 text-lg text-white/80">
                  {project.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-4 border-white bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-punk-blue transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]"
                  >
                    Visit Project →
                  </a>

                  {project.twitter && (
                    <a
                      href={`https://x.com/${project.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 border-4 border-white bg-punk-pink px-4 py-3 text-sm font-bold text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]"
                    >
                      <XIcon className="h-4 w-4" />
                      @{project.twitter}
                    </a>
                  )}

                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 border-4 border-white px-4 py-3 text-sm font-bold text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-white/10"
                    >
                      <GitHubIcon className="h-4 w-4" />
                      GitHub
                    </a>
                  )}

                  {project.discord && (
                    <a
                      href={project.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 border-4 border-white px-4 py-3 text-sm font-bold text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-white/10"
                    >
                      <DiscordIcon className="h-4 w-4" />
                      Discord
                    </a>
                  )}
                </div>

                {/* Tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => (
                    <span
                      key={tag}
                      className={`pixel-tag ${i % 2 === 0 ? "border-white bg-white text-punk-blue" : "border-white bg-punk-pink text-white"}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="mt-6 flex items-center gap-6 text-sm text-white/60">
                  <span>Launched {formattedDate}</span>
                  <Link
                    href={`/${punkId}`}
                    className="flex items-center gap-2 hover:text-white"
                  >
                    <PunkAvatar punkId={punkId} size={24} />
                    <span>by {project.punkName || `Punk #${punkId}`}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        {project.body && (
          <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <Markdown>{project.body}</Markdown>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
