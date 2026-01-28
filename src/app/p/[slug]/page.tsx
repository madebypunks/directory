import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { Header, Footer, PunkAvatar, ProjectThumbnail, Button } from "@/components";
import { XIcon, GitHubIcon, DiscordIcon } from "@/components/icons";
import { getProjectById, getAllProjects, getProjectCreators } from "@/data/punks";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((project) => ({
    slug: project.id,
  }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectById(slug);

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
  const { slug } = await params;
  const project = getProjectById(slug);

  if (!project) {
    notFound();
  }

  const creators = getProjectCreators(project);

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
        <section className="bg-punk-blue">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-base font-bold uppercase tracking-wider text-white/80 transition-colors hover:text-white"
            >
              ← Back
            </Link>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              {/* Thumbnail */}
              <div className="relative aspect-video w-full max-w-md overflow-hidden bg-punk-blue-light lg:w-96 pixel-shadow">
                <ProjectThumbnail
                  projectUrl={project.url}
                  projectName={project.name}
                  thumbnail={project.thumbnail}
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="font-pixel-custom text-3xl uppercase tracking-wider text-white sm:text-4xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
                  {project.name}
                </h1>
                <p className="mt-2 text-lg text-white/80 leading-relaxed">
                  {project.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="white"
                    size="md"
                    className="text-punk-blue"
                  >
                    View →
                  </Button>

                  {project.twitter && (
                    <Button
                      href={`https://x.com/${project.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      size="md"
                      className="gap-2"
                    >
                      <XIcon className="h-4 w-4" />
                      @{project.twitter}
                    </Button>
                  )}

                  {project.github && (
                    <Button
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                      size="md"
                      className="gap-2"
                    >
                      <GitHubIcon className="h-4 w-4" />
                      GitHub
                    </Button>
                  )}

                  {project.discord && (
                    <Button
                      href={project.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                      size="md"
                      className="gap-2"
                    >
                      <DiscordIcon className="h-4 w-4" />
                      Discord
                    </Button>
                  )}
                </div>

                {/* Meta */}
                <div className="mt-8 flex flex-wrap items-center gap-6 text-base text-white/60 font-mono">
                  <span>Launched {formattedDate}</span>
                  <div className="flex items-center gap-4">
                    <span>by</span>
                    {creators.map((creator) => (
                      <Link
                        key={creator.id}
                        href={`/${creator.id}`}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <PunkAvatar punkId={creator.id} size={24} className="border-0!" />
                        <span>{creator.name || `#${creator.id}`}</span>
                      </Link>
                    ))}
                  </div>
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
