"use client";

import Link from "next/link";
import { PunkAvatar } from "./PunkAvatar";

interface PunkLinkProps {
  punkId: number;
  name?: string;
  size?: "xs" | "sm" | "md";
  variant?: "link" | "inline" | "ghost" | "subtle" | "light";
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const sizeConfig = {
  xs: { avatar: 18, height: 20, text: "text-xs", padding: "px-1.5 py-0.5" },
  sm: { avatar: 20, height: 24, text: "text-xs", padding: "pl-1 pr-1.5" },
  md: { avatar: 28, height: 30, text: "text-sm", padding: "pl-1.5 pr-2 py-1" },
};

const variantConfig = {
  // For markdown content - naked link style, aligns with surrounding text
  link: {
    container: "items-baseline no-underline! hover:underline!",
    text: "text-white! font-bold",
    noFixedHeight: true,
    padding: "pl-1", // Only left padding, no right padding for inline flow
  },
  // For markdown content - blue tinted box
  inline: {
    container: "items-center no-underline! bg-punk-blue/10 hover:bg-punk-blue/20 border border-punk-blue/20 hover:border-punk-blue/30",
    text: "text-punk-blue/80",
  },
  // For project cards - transparent, hover effect
  ghost: {
    container: "items-center no-underline! hover:text-punk-pink",
    text: "opacity-70 group-hover:opacity-100",
  },
  // For project list items - exact original styling
  subtle: {
    container: "items-center no-underline! bg-foreground/5 hover:bg-foreground/10 border border-transparent hover:border-white/10",
    text: "opacity-70",
  },
  // For project page header - white on blue
  light: {
    container: "items-center no-underline! bg-white/10 hover:bg-white/20 border border-transparent hover:border-white/10",
    text: "text-white/80",
  },
};

export function PunkLink({
  punkId,
  name,
  size = "sm",
  variant = "link",
  onClick,
  className = "",
}: PunkLinkProps) {
  const sizeConf = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  };

  const hasFixedHeight = !("noFixedHeight" in variantStyles && variantStyles.noFixedHeight);
  const isLinkVariant = variant === "link";

  return (
    <Link
      href={`/${punkId}`}
      onClick={onClick ? handleClick : undefined}
      className={`group inline-flex whitespace-nowrap transition-colors ${variantStyles.container} ${className} ${isLinkVariant ? "punk-link" : ""}`}
      style={hasFixedHeight ? { height: sizeConf.height } : undefined}
    >
      <PunkAvatar punkId={punkId} size={sizeConf.avatar} className="border-0! shrink-0" />
      <span className={`${"padding" in variantStyles ? variantStyles.padding : sizeConf.padding} ${variantStyles.text}`}>
        {name || `#${punkId}`}
      </span>
    </Link>
  );
}
