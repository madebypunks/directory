import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/constants";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
            fontSize: 20,
            fontWeight: 900,
            color: "white",
            textShadow: "1px 1px 0 #000",
          }}
        >
          P
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
