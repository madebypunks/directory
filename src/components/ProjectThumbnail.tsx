"use client";

import { useOGImage } from "@/hooks/useOGImage";
import { SafeImage } from "./SafeImage";

interface ProjectThumbnailProps {
  projectUrl: string;
  projectName: string;
  thumbnail?: string;
  mode?: "cover" | "contain";
}

export function ProjectThumbnail({
  projectUrl,
  projectName,
  thumbnail,
  mode = "cover",
}: ProjectThumbnailProps) {
  // Only fetch OG image if no thumbnail is provided
  const { imageUrl: ogImageUrl, loading } = useOGImage(
    thumbnail ? undefined : projectUrl
  );

  // Use provided thumbnail, or fetched OG image, or fallback to placeholder
  const imageSrc = thumbnail || ogImageUrl;

  const fallbackClass = mode === "cover"
    ? "absolute inset-0 flex items-center justify-center bg-punk-blue-light"
    : "aspect-video flex items-center justify-center bg-punk-blue-light";

  if (loading) {
    return (
      <div className={`${fallbackClass} animate-pulse`}>
        <div className="h-12 w-12 border-4 border-white opacity-40" />
      </div>
    );
  }

  if (!imageSrc) {
    // Fallback: show project initial
    return (
      <div className={fallbackClass}>
        <span className="text-6xl font-black uppercase text-white text-center opacity-60">
          {projectName.charAt(0)}
        </span>
      </div>
    );
  }

  if (mode === "contain") {
    return (
      <SafeImage
        src={imageSrc}
        alt={projectName}
        width={800}
        height={600}
        className="pixelated w-full h-auto"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        unoptimized
        fallbackText={projectName}
      />
    );
  }

  return (
    <SafeImage
      src={imageSrc}
      alt={projectName}
      fill
      className="pixelated object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      unoptimized
      fallbackText={projectName}
      fallbackMode="fill"
    />
  );
}
