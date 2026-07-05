import { cn } from "@/lib/utils";

export function Alert({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-md border border-steel-200 p-4 text-sm", className)}>
      {children}
    </div>
  );
}
