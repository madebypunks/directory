import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/constants";
import { loadSilkscreenFont, silkscreenFontConfig } from "@/lib/fonts";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default async function Icon() {
  const silkscreenFont = await loadSilkscreenFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.punkBlue,
        }}
      >
        <div
          style={{
            fontFamily: "Silkscreen",
            fontSize: 20,
            fontWeight: 400,
            color: "white",
          }}
        >
          P
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          ...silkscreenFontConfig,
          data: silkscreenFont,
        },
      ],
    }
  );
}
