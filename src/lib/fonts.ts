// Silkscreen pixel font for OG images and favicons
const SILKSCREEN_URL =
  "https://fonts.gstatic.com/s/silkscreen/v6/m8JXjfVPf62XiF7kO-i9ULQ.ttf";

export async function loadSilkscreenFont(): Promise<ArrayBuffer> {
  const response = await fetch(SILKSCREEN_URL);
  return response.arrayBuffer();
}

export const silkscreenFontConfig = {
  name: "Silkscreen",
  style: "normal" as const,
  weight: 400 as const,
};
