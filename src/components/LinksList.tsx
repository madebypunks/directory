import Image from "next/image";
import { IconType } from "react-icons";
import {
  FaDiscord,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaLink
} from "react-icons/fa";
import { FaBluesky, FaXTwitter } from "react-icons/fa6";

interface LinksListProps {
  links: string[];
  className?: string;
}

interface ParsedLink {
  url: string;
  label: string;
  favicon: string;
  icon?: IconType;
}

/**
 * Parse a URL and extract a smart label
 * - Social networks: show username
 * - Regular sites: show domain
 */
function parseLink(url: string): ParsedLink {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");
    const pathname = parsed.pathname;

    // X/Twitter: https://x.com/username or https://twitter.com/username
    if (hostname === "x.com" || hostname === "twitter.com") {
      const username = pathname.split("/")[1];
      if (username) {
        return {
          url,
          label: username,
          favicon: `https://www.google.com/s2/favicons?domain=x.com&sz=32`,
          icon: FaXTwitter,
        };
      }
    }

    // Bluesky: https://bsky.app/profile/username
    if (hostname === "bsky.app") {
      const parts = pathname.split("/");
      const profileIndex = parts.indexOf("profile");
      if (profileIndex !== -1 && parts[profileIndex + 1]) {
        const handle = parts[profileIndex + 1];
        return {
          url,
          label: handle.replace(".bsky.social", ""),
          favicon: `https://www.google.com/s2/favicons?domain=bsky.app&sz=32`,
          icon: FaBluesky,
        };
      }
    }

    // Instagram: https://instagram.com/username
    if (hostname === "instagram.com") {
      const username = pathname.split("/")[1];
      if (username) {
        return {
          url,
          label: username,
          favicon: `https://www.google.com/s2/favicons?domain=instagram.com&sz=32`,
          icon: FaInstagram,
        };
      }
    }

    // LinkedIn: https://linkedin.com/in/username
    if (hostname === "linkedin.com") {
      const parts = pathname.split("/");
      if (parts[1] === "in" && parts[2]) {
        return {
          url,
          label: parts[2],
          favicon: `https://www.google.com/s2/favicons?domain=linkedin.com&sz=32`,
          icon: FaLinkedin,
        };
      }
    }

    // GitHub: https://github.com/username
    if (hostname === "github.com") {
      const username = pathname.split("/")[1];
      if (username) {
        return {
          url,
          label: username,
          favicon: `https://www.google.com/s2/favicons?domain=github.com&sz=32`,
          icon: FaGithub,
        };
      }
    }

    // YouTube: https://youtube.com/@username
    if (hostname === "youtube.com" || hostname === "youtu.be") {
      const parts = pathname.split("/");
      if (parts[1] && parts[1].startsWith("@")) {
        return {
          url,
          label: parts[1].slice(1),
          favicon: `https://www.google.com/s2/favicons?domain=youtube.com&sz=32`,
          icon: FaYoutube,
        };
      }
    }

    // Discord invite: https://discord.gg/invite
    if (hostname === "discord.gg" || hostname === "discord.com") {
      return {
        url,
        label: "Discord",
        favicon: `https://www.google.com/s2/favicons?domain=discord.com&sz=32`,
        icon: FaDiscord,
      };
    }

    // Default: show domain
    return {
      url,
      label: hostname,
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      icon: FaLink
    };
  } catch {
    return {
      url,
      label: url,
      favicon: "",
    };
  }
}

export function LinksList({ links, className = "" }: LinksListProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {links.map((link) => {
        const { url, label, icon: Icon, favicon } = parseLink(link);

        return (
          <a
            key={link}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground/10 hover:bg-foreground/20 transition-colors font-medium"
          >
            {Icon ? (
              <Icon
                size={14}
              />
            ) : favicon ? (
              <Image
                src={favicon}
                alt=""
                width={14}
                height={14}
                unoptimized
              />
            ) : null}
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}
