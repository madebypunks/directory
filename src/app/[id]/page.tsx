import { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { Header, Footer, PunkAvatar, ProjectListItem, LinksList, BackButton, CTASection } from "@/components";
import { getPunkById, getAllPunks, getProjectsByPunk, getProjectCreators } from "@/data/punks";
import { generatePunkEditUrl } from "@/lib/github";

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

  const projects = getProjectsByPunk(punkId);
  const name = punk.name || `Punk #${punkId}`;

  // Build engaging description based on whether they have a name and/or works
  let description: string;
  if (punk.name && projects.length > 0) {
    description = `Meet ${punk.name}, owner of CryptoPunk #${punkId}. Explore ${projects.length} work${projects.length !== 1 ? "s" : ""} they've created.`;
  } else if (punk.name) {
    description = `Meet ${punk.name}, owner of CryptoPunk #${punkId}. Discover their profile on Made by Punks.`;
  } else if (projects.length > 0) {
    description = `Discover ${projects.length} work${projects.length !== 1 ? "s" : ""} created by the owner of CryptoPunk #${punkId}.`;
  } else {
    description = `View the profile of CryptoPunk #${punkId} owner on Made by Punks.`;
  }

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

  const projects = getProjectsByPunk(punkId);
  const name = punk.name || `Punk #${punkId}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          {/* Punk Header */}
          <section className="bg-punk-blue">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <BackButton className="mb-6" />

            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <PunkAvatar
                punkId={punkId}
                size={120}
                className="pixel-shadow"
              />

              <div className="flex-1">
                <h1 className="font-pixel-custom text-3xl uppercase tracking-wider text-white sm:text-4xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
                  {name}
                </h1>
                <p className="mt-1 text-lg text-white/60 font-mono">
                  CryptoPunk #{punkId}
                </p>

                {punk.links && punk.links.length > 0 && (
                  <div className="mt-6">
                    <LinksList links={punk.links} className="text-white/70" />
                  </div>
                )}
              </div>

              {projects.length > 0 && (
                <div className="bg-white/10 px-6 py-4 text-center backdrop-blur-sm">
                  <div className="text-4xl font-bold text-white">
                    {projects.length}
                  </div>
                  <div className="text-base font-bold uppercase tracking-wider text-white/80 font-pixel">
                    Work{projects.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
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

        {/* Projects List */}
        {projects.length > 0 && (
          <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-xl font-bold uppercase tracking-wider">
              Works
            </h2>
            <div>
              {projects.map((project) => {
                const collaborators = getProjectCreators(project).filter(
                  (p) => p.id !== punkId
                );
                return (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    collaborators={collaborators}
                    size="default"
                  />
                );
              })}
            </div>
          </section>
        )}
        </div>

        <CTASection
          title="Know this punk?"
          description="Help us build the most complete directory of CryptoPunks holders. Anyone can contribute."
          buttonLabel="Contribute →"
          href={generatePunkEditUrl({
            punkId,
            name: punk.name,
          })}
          external
        />
      </main>

      <Footer />
    </div>
  );
}
