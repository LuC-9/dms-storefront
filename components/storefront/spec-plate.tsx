import { cn } from "@/lib/utils";

type SpecPlateProps = {
  lines: string[];
  className?: string;
};

export function SpecPlate({ lines, className }: SpecPlateProps) {
  return (
    <div
      className={cn(
        "border border-steel-500 bg-forge-950 p-2 font-mono text-xs leading-5 tracking-wide text-safety-orange shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]",
        className,
      )}
    >
      {lines.map((line) => (
        <p key={line} className="truncate">
          {line}
        </p>
      ))}
    </div>
  );
}
