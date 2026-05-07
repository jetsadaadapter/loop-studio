import Image from "next/image";

interface ManageLogoProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function ManageLogo({
  src = "/images/logo/logo-black-110x30.png",
  alt = "Admin Workspace",
  width = 110,
  height = 30,
}: ManageLogoProps) {
  return (
    <div className="flex items-center shrink-0">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg object-contain"
        priority
      />
    </div>
  );
}
