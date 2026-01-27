import { generateOGImage } from "@/lib/og-image";
import { getAllPunks } from "@/data/projects";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export const runtime = "edge";

export const alt = "Made by Punks - CryptoPunks Project Directory";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const punkIds = getAllPunks().slice(0, 6);

  return generateOGImage(
    {
      title: SITE_NAME,
      subtitle: SITE_DESCRIPTION,
      punkIds,
    },
    size
  );
}
