import React, { useEffect, useState } from "react";

type SafeImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackLabel?: string;
};

export const SafeImage = ({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  fallbackLabel,
}: SafeImageProps) => {
  const [hasFailed, setHasFailed] = useState(false);
  const normalizedSrc = src?.trim() ?? "";

  useEffect(() => {
    setHasFailed(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || hasFailed) {
    return (
      <div
        aria-label={alt}
        className={`flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(193,154,91,0.16),_transparent_55%)] px-6 text-center ${fallbackClassName}`}
      >
        <span className="font-cinzel text-lg uppercase tracking-[0.2em] text-[#C19A5B]/80">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className={className}
      onError={() => setHasFailed(true)}
    />
  );
};
