import { Button } from "./Button";

interface CTASectionProps {
  title: string;
  description: string;
  buttonLabel: string;
  href?: string;
  external?: boolean;
}

export function CTASection({
  title,
  description,
  buttonLabel,
  href = "/add",
  external = false,
}: CTASectionProps) {
  const linkProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <section className="bg-punk-pink">
      <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold uppercase tracking-wider text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
          {title}
        </h2>
        <p className="mt-3 text-white/90 text-base max-w-lg mx-auto">
          {description}
        </p>
        <Button href={href} variant="white" size="sm" className="mt-6 text-punk-pink" {...linkProps}>
          {buttonLabel}
        </Button>
      </div>
    </section>
  );
}
