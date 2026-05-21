import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  withWordmark?: boolean;
};

const COIN_FONT =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <circle cx="16" cy="16" r="10" className="fill-primary-foreground" />
      <text
        x="16"
        y="16"
        fontFamily={COIN_FONT}
        fontWeight={800}
        fontSize="15"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-primary"
      >
        $
      </text>
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  withWordmark = true,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      {withWordmark ? (
        <span
          className={cn(
            "font-heading text-sm font-semibold tracking-tight",
            wordmarkClassName,
          )}
        >
          Splitty
        </span>
      ) : null}
    </span>
  );
}
