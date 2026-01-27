import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { Header, Footer, PunkAvatar, ProjectCard } from "@/components";
import { getPunkById, getAllPunks } from "@/data/punks";

interface PunkPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const punkIds = getAllPunks();
  return punkIds.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: PunkPageProps): Promise<Metadata> {
  const { id } = await params;
  const punkId = parseInt(id, 10);
  const punk = getPunkById(punkId);

  if (!punk) {
    return {
      title: "Punk Not Found | Made by Punks",
    };
  }

  const name = punk.name || `Punk #${punkId}`;
  const description = `Discover ${punk.projects.length} project${punk.projects.length !== 1 ? "s" : ""} inspired by Punk #${punkId}. Made by Punks - a community-curated directory of CryptoPunks projects.`;

  return {
    title: `${name} | Made by Punks`,
    description,
    openGraph: {
      title: `${name} | Made by Punks`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Made by Punks`,
      description,
    },
  };
}

export default async function PunkPage({ params }: PunkPageProps) {
  const { id } = await params;
  const punkId = parseInt(id, 10);
  const punk = getPunkById(punkId);

  if (!punk) {
    notFound();
  }

  const name = punk.name || `Punk #${punkId}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Punk Header */}
        <section className="border-b-4 border-foreground bg-punk-blue">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/80 transition-colors hover:text-white"
            >
              ← Back
            </Link>

            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <PunkAvatar
                punkId={punkId}
                size={120}
                className="pixel-shadow"
              />

              <div className="flex-1">
                <h1 className="text-3xl font-bold uppercase tracking-wider text-white sm:text-4xl">
                  {name}
                </h1>
                <p className="mt-1 text-lg text-white/60">
                  CryptoPunk #{punkId}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {punk.twitter && (
                    <a
                      href={`https://x.com/${punk.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-4 border-white bg-white px-4 py-2 text-sm font-bold uppercase tracking-wider text-punk-blue transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]"
                    >
                      @{punk.twitter}
                    </a>
                  )}
                  {punk.website && (
                    <a
                      href={punk.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-4 border-white bg-punk-pink px-4 py-2 text-sm font-bold uppercase tracking-wider text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]"
                    >
                      Website
                    </a>
                  )}
                </div>
              </div>

              <div className="border-4 border-white bg-white px-6 py-4 text-center">
                <div className="text-4xl font-bold text-punk-blue">
                  {punk.projects.length}
                </div>
                <div className="text-sm font-bold uppercase tracking-wider text-punk-blue">
                  Project{punk.projects.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Content (from markdown) */}
        {punk.body && (
          <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="prose prose-punk">
              <Markdown>{punk.body}</Markdown>
            </div>
          </section>
        )}

        {/* Projects Grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-xl font-bold uppercase tracking-wider">
            Projects featuring Punk #{punkId}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {punk.projects.map((project) => (
              <ProjectCard key={project.id} project={project} punkId={punkId} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
