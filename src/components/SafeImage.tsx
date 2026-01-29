"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { BrokenImageIcon } from "./icons";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackText?: string;
}

export function SafeImage({
  fallbackText,
  alt,
  className,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-punk-blue-light">
        <div className="flex flex-col items-center gap-2 text-white opacity-60">
          <BrokenImageIcon className="h-8 w-8" />
          {fallbackText && (
            <span className="text-xs text-center font-bold uppercase tracking-wider">
              {fallbackText}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
