import { ImageResponse } from "next/og";
import { COLORS } from "./constants";
import { loadSilkscreenFont, silkscreenFontConfig } from "./fonts";
import { readFileSync } from "fs";
import { join } from "path";

interface OGImageOptions {
  width: number;
  height: number;
}

interface OGImageProps {
  title: string;
  subtitle?: string;
  punkIds?: number[];
  punkId?: number;
  projectCount?: number;
  titleColor?: string;
}

interface ProjectOGImageProps {
  name: string;
  description: string;
  thumbnail?: string;
  punkId: number;
  tags?: string[];
}

function getPunkImageUrl(punkId: number) {
  // Use size=240 for OG images since Satori doesn't support image-rendering: pixelated
  return `https://punks.art/api/punks/${punkId}?format=png&size=240&background=v2`;
}

export function generateNotFoundImage(options: OGImageOptions): ImageResponse {
  const { width, height } = options;
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
          fontWeight: 400,
          textTransform: "uppercase",
        }}
      >
        Punk Not Found
      </div>
    ),
    { width, height }
  );
}

export async function generateOGImage(
  props: OGImageProps,
  options: OGImageOptions
): Promise<ImageResponse> {
  const { width, height } = options;
  const { title, subtitle, punkIds, punkId, projectCount, titleColor } = props;

  // Load Silkscreen font
  const silkscreenFont = await loadSilkscreenFont();

  // Single punk view - clean, modern design with two-tone blue
  if (punkId !== undefined) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            backgroundColor: COLORS.punkBlueDark,
            padding: "50px",
            gap: "50px",
          }}
        >
          {/* Punk avatar area - square with lighter blue background */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.punkBlue,
              width: "480px",
              height: "480px",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <img
              src={getPunkImageUrl(punkId)}
              width={480}
              height={480}
              style={{
                objectFit: "cover",
                imageRendering: "pixelated",
              }}
            />
          </div>

          {/* Info on the right - same height as image */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              height: "480px",
            }}
          >
            {/* Top section: Name + Punk ID */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Name - Pixel font, pink color */}
              <div
                style={{
                  display: "flex",
                  fontFamily: "Silkscreen",
                  fontSize: 64,
                  fontWeight: 400,
                  color: COLORS.punkPink,
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                {title}
              </div>

              {/* Punk ID */}
              <div
                style={{
                  display: "flex",
                  fontFamily: "Silkscreen",
                  fontSize: 40,
                  fontWeight: 400,
                  color: "white",
                  textTransform: "uppercase",
                  marginTop: "8px",
                  opacity: 0.6,
                }}
              >
                #{punkId}
              </div>
            </div>

            {/* Middle section: Works count */}
            {projectCount !== undefined && projectCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    fontFamily: "Silkscreen",
                    fontSize: 48,
                    fontWeight: 400,
                    color: "white",
                    lineHeight: 1,
                  }}
                >
                  {projectCount}
                </span>
                <span
                  style={{
                    display: "flex",
                    fontFamily: "Silkscreen",
                    fontSize: 40,
                    fontWeight: 400,
                    color: "white",
                    textTransform: "uppercase",
                    opacity: 0.7,
                    lineHeight: 1,
                  }}
                >
                  work{projectCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Bottom section: Made by Punks branding */}
            <div
              style={{
                display: "flex",
                fontFamily: "Silkscreen",
                fontSize: 32,
                fontWeight: 400,
                color: "white",
                textTransform: "uppercase",
                paddingTop: "40px",
                opacity: 0.4,
              }}
            >
              madebypunks.co
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
        fonts: [
          {
            ...silkscreenFontConfig,
            data: silkscreenFont,
          },
        ],
      }
    );
  }

  // Multiple punks view (homepage) - centered design with padding
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
          padding: "60px",
        }}
      >
        {/* Punks row */}
        {punkIds && punkIds.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            {punkIds.slice(0, 5).map((id) => (
              <div
                key={id}
                style={{
                  display: "flex",
                }}
              >
                <img
                  src={getPunkImageUrl(id)}
                  width={120}
                  height={120}
                  style={{
                    imageRendering: "pixelated",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Title - centered */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Made by PUNKS */}
          <div
            style={{
              display: "flex",
              fontFamily: "Silkscreen",
              fontSize: 100,
              fontWeight: 400,
              color: titleColor || COLORS.punkPink,
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {title}
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              fontFamily: "Silkscreen",
              fontSize: 40,
              fontWeight: 400,
              color: "white",
              textTransform: "uppercase",
              marginTop: "28px",
              opacity: 0.7,
              maxWidth: "1000px",
              textAlign: "center",
              justifyContent: "center",
            }}
          >
            A CryptoPunks Directory
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        {
          name: "Silkscreen",
          data: silkscreenFont,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}

export async function generateProjectOGImage(
  props: ProjectOGImageProps,
  options: OGImageOptions,
  siteUrl: string
): Promise<ImageResponse> {
  const { width, height } = options;
  const { name, description, thumbnail, punkId, tags } = props;

  // Load Silkscreen font
  const silkscreenFont = await loadSilkscreenFont();

  // Only use local thumbnails (starting with /) to avoid external image loading issues
  // Skip GIFs as they're not supported by next/og ImageResponse
  const isLocalThumbnail = thumbnail?.startsWith("/");
  const isGif = thumbnail?.endsWith(".gif");
  const canUseThumbnail = isLocalThumbnail && !isGif;

  // If local thumbnail exists (and not a GIF), show it prominently
  if (canUseThumbnail && thumbnail) {
    // Read local file directly from filesystem during build
    let thumbnailUrl: string;
    try {
      const filePath = join(process.cwd(), "public", thumbnail);
      const fileBuffer = readFileSync(filePath);
      const base64 = fileBuffer.toString("base64");
      const mimeType = thumbnail.endsWith(".png") ? "image/png" : "image/jpeg";
      thumbnailUrl = `data:${mimeType};base64,${base64}`;
    } catch {
      // Fallback to URL if file read fails
      thumbnailUrl = `${siteUrl}${thumbnail}`;
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            backgroundColor: COLORS.punkBlueDark,
          }}
        >
          {/* Thumbnail - left side, lighter blue */}
          <div
            style={{
              width: "55%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.punkBlue,
              padding: "40px",
            }}
          >
            <img
              src={thumbnailUrl}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Info - right side, darker blue */}
          <div
            style={{
              width: "45%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            {/* Project name */}
            <div
              style={{
                display: "flex",
                fontFamily: "Silkscreen",
                fontSize: 40,
                fontWeight: 400,
                color: "white",
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>

            {/* Description */}
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 400,
                color: "white",
                marginTop: "16px",
                opacity: 0.8,
                lineHeight: 1.5,
              }}
            >
              {description.length > 120
                ? description.slice(0, 120) + "..."
                : description}
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "24px",
                }}
              >
                {tags.slice(0, 3).map((tag) => (
                  <div
                    key={tag}
                    style={{
                      display: "flex",
                      fontFamily: "Silkscreen",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      padding: "6px 12px",
                      fontSize: 14,
                      fontWeight: 400,
                      textTransform: "uppercase",
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* Punk avatar + branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "32px",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                }}
              >
                <img
                  src={getPunkImageUrl(punkId)}
                  width={48}
                  height={48}
                  style={{
                    imageRendering: "pixelated",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "Silkscreen",
                  fontSize: 16,
                  fontWeight: 400,
                  color: "white",
                  textTransform: "uppercase",
                  opacity: 0.5,
                }}
              >
                madebypunks.co
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
        fonts: [
          {
            ...silkscreenFontConfig,
            data: silkscreenFont,
          },
        ],
      }
    );
  }

  // Fallback: text-only with punk avatar - two-tone design
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "stretch",
          backgroundColor: COLORS.punkBlueDark,
        }}
      >
        {/* Punk avatar area - lighter blue */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.punkBlue,
            padding: "60px",
            flexShrink: 0,
          }}
        >
          <img
            src={getPunkImageUrl(punkId)}
            width={280}
            height={280}
            style={{
              imageRendering: "pixelated",
            }}
          />
        </div>

        {/* Info - darker blue */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "60px",
          }}
        >
          {/* Project name */}
          <div
            style={{
              display: "flex",
              fontFamily: "Silkscreen",
              fontSize: 52,
              fontWeight: 400,
              color: "white",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            {name}
          </div>

          {/* Description */}
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 400,
              color: "white",
              marginTop: "20px",
              opacity: 0.8,
              lineHeight: 1.5,
              maxWidth: "550px",
            }}
          >
            {description.length > 150
              ? description.slice(0, 150) + "..."
              : description}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "28px",
              }}
            >
              {tags.slice(0, 4).map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    fontFamily: "Silkscreen",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    padding: "8px 14px",
                    fontSize: 16,
                    fontWeight: 400,
                    textTransform: "uppercase",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              display: "flex",
              fontFamily: "Silkscreen",
              fontSize: 18,
              fontWeight: 400,
              color: "white",
              textTransform: "uppercase",
              marginTop: "36px",
              opacity: 0.4,
            }}
          >
            madebypunks.co
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        {
          name: "Silkscreen",
          data: silkscreenFont,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
