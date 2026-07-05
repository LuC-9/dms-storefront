import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = ({ className, ...props }: React.ComponentProps<"table">) => (
  <div className="w-full overflow-x-auto">
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
);
export const TableHeader = (props: React.ComponentProps<"thead">) => (
  <thead className="[&_tr]:border-b" {...props} />
);
export const TableBody = (props: React.ComponentProps<"tbody">) => (
  <tbody className="[&_tr:last-child]:border-0" {...props} />
);
export const TableRow = (props: React.ComponentProps<"tr">) => (
  <tr className="border-b transition-colors hover:bg-steel-50" {...props} />
);
export const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => (
  <th className={cn("h-12 px-4 text-left align-middle font-medium text-steel-700", className)} {...props} />
);
export const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => (
  <td className={cn("p-4 align-middle", className)} {...props} />
);
