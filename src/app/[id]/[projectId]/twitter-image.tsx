import { generateProjectOGImage, generateNotFoundImage } from "@/lib/og-image";
import { getProjectById, getAllProjectParams } from "@/data/punks";
import { SITE_URL } from "@/lib/constants";

export const runtime = "nodejs";

export async function generateStaticParams() {
  return getAllProjectParams();
}

export const alt = "Made by Punks";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = await params;
  const punkId = parseInt(id, 10);
  const project = getProjectById(punkId, projectId);

  if (!project) {
    return generateNotFoundImage(size);
  }

  return generateProjectOGImage(
    {
      name: project.name,
      description: project.description,
      thumbnail: project.thumbnail,
      punkId,
      tags: project.tags,
    },
    size,
    SITE_URL
  );
}
