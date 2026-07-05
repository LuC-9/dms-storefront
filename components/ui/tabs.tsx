import { cn } from "@/lib/utils";

export function Tabs({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 flex gap-2 rounded-md bg-steel-100 p-1">{children}</div>;
}

export function TabsTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-md bg-white px-3 py-1 text-sm", className)}>{children}</div>;
}

export function TabsContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
