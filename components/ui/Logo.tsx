import Link from "next/link";

export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-soft-blue"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[74%] w-[74%]"
      >
        <path
          d="M19 20C19 16.6863 21.2386 14 24 14C26.7614 14 29 16.6863 29 20"
          stroke="#2563EB"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect
          x="15"
          y="20"
          width="18"
          height="18"
          rx="3"
          stroke="#2563EB"
          strokeWidth="2.5"
        />
      </svg>
    </span>
  );
}

export default function Logo({
  href,
  tone = "light",
  markSize = 38,
}: {
  href: string;
  tone?: "light" | "dark";
  markSize?: number;
}) {
  return (
    <Link
      href={href}
      dir="ltr"
      aria-label="Hanutek"
      className="inline-flex min-h-11 shrink-0 items-center gap-2.5"
    >
      <LogoMark size={markSize} />
      <span
        className={`display-cut text-[22px] leading-none ${
          tone === "dark" ? "text-white" : "text-obsidian"
        }`}
      >
        hanutek<span className="text-sale">.</span>
      </span>
    </Link>
  );
}