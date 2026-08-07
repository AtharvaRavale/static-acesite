import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      <path d="M16 2L2 28H10L16 16L22 28H30L16 2Z" fill="currentColor" />
      <path d="M16 19L20.5 28H11.5L16 19Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
