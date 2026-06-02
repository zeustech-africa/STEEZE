"use client";

import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 85,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  // Fallback to placeholder on error
  const imageSrc = error ? "/images/placeholder.jpg" : src;

  const commonProps = {
    src: imageSrc,
    alt,
    className: `${className} ${error ? "opacity-50" : ""}`,
    quality,
    priority,
    sizes,
    onError: () => setError(true),
  };

  if (fill) {
    return <Image {...commonProps} fill />;
  }

  return <Image {...commonProps} width={width} height={height} />;
}