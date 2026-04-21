"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type AppIconProps = {
  name: string;
  iconUrl?: string;
  alt?: string;
  containerClassName: string;
  fallbackClassName: string;
  initialsClassName: string;
  imageSizes: string;
  imageOuterClassName?: string;
  imageInnerClassName?: string;
  imageClassName?: string;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppIcon({
  name,
  iconUrl,
  alt,
  containerClassName,
  fallbackClassName,
  initialsClassName,
  imageSizes,
  imageOuterClassName = "absolute inset-0 p-1.5",
  imageInnerClassName = "relative size-full overflow-hidden rounded-lg",
  imageClassName = "object-cover",
}: AppIconProps) {
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);

  const initials = useMemo(() => getInitials(name), [name]);
  const canShowImage = Boolean(iconUrl) && iconUrl !== erroredUrl;

  return (
    <div className={containerClassName}>
      {canShowImage ? (
        <div className={imageOuterClassName}>
          <div className={imageInnerClassName}>
            <Image
              src={iconUrl as string}
              alt={alt ?? `${name} icon`}
              fill
              sizes={imageSizes}
              className={imageClassName}
              onError={() => setErroredUrl(iconUrl ?? null)}
            />
          </div>
        </div>
      ) : (
        <div className={fallbackClassName}>
          <span className={initialsClassName}>{initials}</span>
        </div>
      )}
    </div>
  );
}
