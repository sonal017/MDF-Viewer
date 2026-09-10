import Image from "next/image";

export default function BrandMark() {
  return (
    <Image
      className="brand-mark"
      src="/brand/mdf-icon-96.png"
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      loading="eager"
      unoptimized
    />
  );
}
