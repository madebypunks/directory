import { ImageResponse } from "next/og";
import { getPunkById } from "@/data/projects";
import { COLORS } from "@/lib/constants";

export const runtime = "nodejs";

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

  const name = punk?.name || `Punk #${punkId}`;

  // Simple text-only OG image for testing
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.punkBlue,
          color: "white",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 900 }}>{name}</div>
        <div style={{ fontSize: 36, marginTop: 20 }}>Punk #{punkId}</div>
        <div style={{ fontSize: 24, marginTop: 40, opacity: 0.6 }}>
          Made by Punks
        </div>
      </div>
    ),
    size
  );
}
