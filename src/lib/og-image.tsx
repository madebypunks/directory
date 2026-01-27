import { ImageResponse } from "next/og";
import { COLORS } from "./constants";

interface OGImageOptions {
  width: number;
  height: number;
}

interface OGImageProps {
  title: string;
  subtitle?: string;
  punkIds?: number[];
  punkId?: number;
}

function getPunkImageUrl(punkId: number) {
  return `https://punks.art/api/punks/${punkId}?format=png&size=24&background=v2`;
}

export async function generateOGImage(
  props: OGImageProps,
  options: OGImageOptions
): Promise<ImageResponse> {
  const { width, height } = options;
  const { title, subtitle, punkIds, punkId } = props;

  // Single punk view
  if (punkId !== undefined) {
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
          }}
        >
          {/* Punk avatar */}
          <div
            style={{
              display: "flex",
              border: "8px solid #000",
              boxShadow: "8px 8px 0 0 #000",
              marginBottom: "40px",
            }}
          >
            <img
              src={getPunkImageUrl(punkId)}
              width={200}
              height={200}
              style={{
                imageRendering: "pixelated",
              }}
            />
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textShadow: "4px 4px 0 #000",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: "16px",
                  opacity: 0.8,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>
      ),
      { width, height }
    );
  }

  // Multiple punks view (homepage)
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
        }}
      >
        {/* Punk avatars */}
        {punkIds && punkIds.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            {punkIds.slice(0, 6).map((id) => (
              <div
                key={id}
                style={{
                  display: "flex",
                  border: "6px solid #000",
                  boxShadow: "6px 6px 0 0 #000",
                }}
              >
                <img
                  src={getPunkImageUrl(id)}
                  width={100}
                  height={100}
                  style={{
                    imageRendering: "pixelated",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: "white",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textShadow: "6px 6px 0 #000",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginTop: "16px",
                opacity: 0.8,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    { width, height }
  );
}
