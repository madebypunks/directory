import { ImageResponse } from "next/og";
import { generateOGImage } from "@/lib/og-image";
import { getPunkById } from "@/data/projects";
import { COLORS, SITE_NAME } from "@/lib/constants";

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
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.punkBlue,
            color: "white",
            fontSize: 64,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          Punk Not Found
        </div>
      ),
      size
    );
  }

  const name = punk.name || `Punk #${punkId}`;
  const projectCount = punk.projects.length;
  const subtitle = `${projectCount} project${projectCount !== 1 ? "s" : ""} • ${SITE_NAME}`;

  return generateOGImage(
    {
      title: name,
      subtitle,
      punkId,
    },
    size
  );
}
