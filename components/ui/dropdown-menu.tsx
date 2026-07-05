export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-steel-200 bg-white p-2">{children}</div>;
}

export function DropdownMenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="block w-full rounded-sm px-2 py-1 text-left hover:bg-steel-50" onClick={onClick}>
      {children}
    </button>
  );
}
