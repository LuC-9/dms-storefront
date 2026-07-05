import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-steel-100 px-2 py-1 text-xs font-medium text-steel-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
