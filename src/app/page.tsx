import { Header, Footer, PunkSection, Button } from "@/components";
import { getAllPunks, getAllTags, PROJECTS, getProjectGroups } from "@/data/punks";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export default function HomePage() {
  const punkIds = getAllPunks();
  const allTags = getAllTags();
  const totalProjects = PROJECTS.length;
  const projectGroups = getProjectGroups();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-punk-blue relative overflow-hidden">
          {/* Pattern overlay could go here */}
          <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 relative z-10">
            <h1 className="font-pixel-custom text-3xl uppercase tracking-wider text-white sm:text-5xl lg:text-6xl drop-shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
              {SITE_NAME}
            </h1>
            <p className="mx-auto mt-4 text-lg font-medium text-white/90 font-mono">
              {SITE_TAGLINE}
            </p>

            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="pixel-shadow bg-punk-blue-light px-5 py-2 transform hover:-translate-y-1 transition-transform">
                <span className="text-2xl font-bold text-white">
                  {punkIds.length}
                </span>
                <span className="ml-2 font-bold uppercase tracking-wider text-white font-pixel">
                  Punks
                </span>
              </div>
              <div className="pixel-shadow bg-punk-pink px-5 py-2 transform hover:-translate-y-1 transition-transform">
                <span className="text-2xl font-bold text-white">
                  {totalProjects}
                </span>
                <span className="ml-2 font-bold uppercase tracking-wider text-white font-pixel">
                  Works
                </span>
              </div>
            </div>

            {/* Tags - show top 8 */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              {allTags.slice(0, 8).map((tag, i) => (
                <span
                  key={tag}
                  className={`pixel-tag cursor-default hover:-translate-y-0.5 transition-transform ${
                    i % 2 === 0
                      ? "bg-punk-blue-light text-white"
                      : "bg-punk-pink text-white"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Projects by Creator Groups */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-900">
          {projectGroups.map((group, index) => (
            <PunkSection
              key={group.key}
              punks={group.punks}
              projects={group.projects}
              isFirst={index === 0}
            />
          ))}
        </div>

        {/* CTA Section */}
        <section className="bg-punk-pink">
          <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold uppercase tracking-wider text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
              Exploring punk art & culture?
            </h2>
            <p className="mt-3 text-white/90 text-base max-w-lg mx-auto">
              Share your CryptoPunks-inspired work with the community.
            </p>
            <Button href="/add" variant="white" size="sm" className="mt-6 text-punk-pink">
              Share Your Work →
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
