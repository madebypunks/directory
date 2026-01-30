import Link from "next/link";
import { Header, Footer } from "@/components";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-punk-blue">404</h1>
          <p className="mt-4 text-xl font-bold uppercase tracking-wider">
            Punk not found
          </p>
          <p className="mt-2 opacity-60">
            This page doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="pixel-btn mt-8 inline-block px-8 py-3"
          >
            ← Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
