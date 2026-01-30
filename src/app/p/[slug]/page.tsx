import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { Header, Footer, PunkAvatar, ProjectThumbnail, Button, LinksList, BackButton, CTASection } from "@/components";
import { getProjectById, getAllProjects, getProjectCreators } from "@/data/punks";
import { generateProjectEditUrl } from "@/lib/github";

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

      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          {/* Project Header */}
          <section className="bg-punk-blue">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <BackButton className="mb-6" />

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              {/* Thumbnail */}
              <div className="w-full max-w-md lg:w-96 pixel-shadow overflow-hidden bg-punk-blue-light">
                <ProjectThumbnail
                  projectUrl={project.url}
                  projectName={project.name}
                  thumbnail={project.thumbnail}
                  mode="contain"
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

                <div className="mt-6 flex flex-wrap items-center gap-4">
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

                  {project.links && project.links.length > 0 && (
                    <LinksList links={project.links} className="text-white/70" />
                  )}
                </div>

                {/* Meta */}
                <div className="mt-8 space-y-3 text-base font-mono">
                  <span className="text-white/60">Launched {formattedDate}</span>

                  {creators.length > 0 && (
                    <div className="mt-4">
                      <span className="block mb-2 text-white/40">Creator{creators.length>1?"s":""}:</span>
                      <div className="flex flex-wrap gap-2">
                        {creators.map((creator) => (
                          <Link
                            key={creator.id}
                            href={`/${creator.id}`}
                            className="flex items-center whitespace-nowrap bg-white/10 hover:bg-white/20 border border-transparent hover:border-white/10 transition-colors"
                            style={{ height: 30 }}
                          >
                            <PunkAvatar punkId={creator.id} size={28} className="border-0!" />
                            <div className="pl-1.5 pr-2 py-1 text-white/80">{creator.name || `#${creator.id}`}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
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
        </div>

        <CTASection
          title="Know more about this project?"
          description="Help us document the work of CryptoPunks holders. Anyone can contribute."
          buttonLabel="Contribute →"
          href={generateProjectEditUrl({
            projectId: project.id,
            name: project.name,
          })}
          external
        />
      </main>

      <Footer />
    </div>
  );
}
