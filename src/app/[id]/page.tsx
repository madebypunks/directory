import { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { Header, Footer, PunkAvatar, ProjectListItem, LinksList, BackButton, CTASection } from "@/components";
import { getPunkById, getAllPunks, getProjectsByPunk, getProjectCreators } from "@/data/punks";
import { generatePunkEditUrl, generateSubmissionUrl } from "@/lib/github";

interface PunkPageProps {
  params: Promise<{ id: string }>;
}

// Valid punk IDs are 0-9999
function isValidPunkId(id: number): boolean {
  return Number.isInteger(id) && id >= 0 && id <= 9999;
}

// Allow dynamic rendering for punk IDs not in the database
export const dynamicParams = true;

export async function generateStaticParams() {
  const punkIds = getAllPunks();
  return punkIds.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: PunkPageProps): Promise<Metadata> {
  const { id } = await params;
  const punkId = parseInt(id, 10);

  if (!isValidPunkId(punkId)) {
    return {
      title: "Not Found | Made by Punks",
    };
  }

  const punk = getPunkById(punkId);

  // Unclaimed punk
  if (!punk) {
    return {
      title: `Punk #${punkId} | Made by Punks`,
      description: `CryptoPunk #${punkId} doesn't have a profile yet. Are you the owner? Claim your page on Made by Punks.`,
      openGraph: {
        title: `Punk #${punkId} | Made by Punks`,
        description: `CryptoPunk #${punkId} doesn't have a profile yet. Are you the owner? Claim your page.`,
      },
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

  // Only 404 for invalid punk IDs (not 0-9999)
  if (!isValidPunkId(punkId)) {
    notFound();
  }

  const punk = getPunkById(punkId);

  // Unclaimed punk - show minimal profile with CTA to create
  if (!punk) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex-1 flex flex-col">
          <div className="flex-1">
            {/* Punk Header */}
            <section className="bg-punk-blue">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <BackButton className="mb-6" />

                <div className="flex flex-col items-center gap-6 text-center">
                  <PunkAvatar
                    punkId={punkId}
                    size={160}
                    className="pixel-shadow"
                  />

                  <div>
                    <h1 className="font-pixel-custom text-3xl uppercase tracking-wider text-white sm:text-4xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]">
                      Punk #{punkId}
                    </h1>
                    <p className="mt-4 text-lg text-white/60">
                      This punk doesn&apos;t have a profile yet.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Empty state message */}
            <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
              <p className="text-lg text-gray-600">
                No one has claimed this page yet. If you own this punk, you can create your profile and share your story with the community.
              </p>
            </section>
          </div>

          <CTASection
            title="Is this your punk?"
            description="Create your profile and join the directory. Just tell us about yourself - we'll handle the rest."
            buttonLabel="Create This Page →"
            href={generateSubmissionUrl()}
            external
          />
        </main>

        <Footer />
      </div>
    );
  }

  // Existing punk profile
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
