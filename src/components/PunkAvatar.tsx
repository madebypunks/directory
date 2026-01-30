import Image from "next/image";

interface PunkAvatarProps {
  punkId: number;
  size?: number;
  className?: string;
  noBackground?: boolean;
}

export function getPunkImageUrl(punkId: number, noBackground: boolean = false) {
  // Always use size=24, CSS pixelated rendering will scale it up
  const bgParam = noBackground ? "" : "&background=v2";
  return `https://punks.art/api/punks/${punkId}?format=png&size=24${bgParam}`;
}

export function PunkAvatar({
  punkId,
  size = 96,
  className = "",
  noBackground = false,
}: PunkAvatarProps) {
  return (
    <span
      className={`relative overflow-hidden inline-block ${noBackground ? "" : "bg-punk-blue-light"} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={getPunkImageUrl(punkId, noBackground)}
        alt={`CryptoPunk #${punkId}`}
        fill
        className="pixelated m-0! border-0! object-cover"
        style={{ imageRendering: "pixelated" }}
        unoptimized
      />
    </span>
  );
}
