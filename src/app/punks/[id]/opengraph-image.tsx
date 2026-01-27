import { generateOGImage, generateNotFoundImage } from "@/lib/og-image";
import { getPunkById } from "@/data/projects";

export const runtime = "edge";

export const alt = "Made by Punks";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const punkId = parseInt(id, 10);
  const punk = getPunkById(punkId);

  if (!punk) {
    return generateNotFoundImage(size);
  }

  const name = punk.name || `Punk #${punkId}`;

  return generateOGImage(
    {
      title: name,
      punkId,
      projectCount: punk.projects.length,
      twitter: punk.twitter,
    },
    size
  );
}
