import Link from "next/link";
import { Header, Footer, PunkSection, Button } from "@/components";
import PUNKS, { getAllPunks, getAllTags } from "@/data/punks";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export default function HomePage() {
  const punkIds = getAllPunks();
  const allTags = getAllTags();
  const totalProjects = PUNKS.reduce(
    (acc, punk) => acc + punk.projects.length,
    0
  );

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
                <span className="ml-2 text-sm font-bold uppercase tracking-wider text-white font-pixel">
                  Punks
                </span>
              </div>
              <div className="pixel-shadow bg-punk-pink px-5 py-2 transform hover:-translate-y-1 transition-transform">
                <span className="text-2xl font-bold text-white">
                  {totalProjects}
                </span>
                <span className="ml-2 text-sm font-bold uppercase tracking-wider text-white font-pixel">
                  Projects
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              {allTags.map((tag, i) => (
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

        {/* Projects by Punk */}
        <div className="mx-auto max-w-7xl divide-y-2 divide-foreground/20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-900">
          {PUNKS.map((punk) => (
            <PunkSection key={punk.id} punk={punk} />
          ))}
        </div>

        {/* CTA Section */}
        <section className="bg-punk-pink">
          <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold uppercase tracking-wider text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
              Building something with Punks?
            </h2>
            <p className="mt-3 text-white/90 text-base max-w-lg mx-auto">
              This directory belongs to the community. Add your project via PR.
            </p>
            <Button href="/add" variant="white" size="sm" className="mt-6 text-punk-pink">
              Add Project →
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
