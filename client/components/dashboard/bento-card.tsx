import { cn } from "@/lib/utils";

/**
 * Bento tile. Now uses the `.card-pop` helper (globals.css): a hairline border
 * that lifts on hover and reveals a faint lime sheen, so the dashboard feels
 * interactive without changing any layout or data wiring. Pass `flat` to opt
 * out of the hover lift for static/empty-state tiles.
 */
export function BentoCard({
  className,
  children,
  flat = false,
}: {
  className?: string;
  children: React.ReactNode;
  flat?: boolean;
}) {
  return (
    <div
      className={cn(
        flat ? "rounded-xl border border-line bg-surface p-5 transition-colors" : "card-pop p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
