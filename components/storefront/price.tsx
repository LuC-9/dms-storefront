type PriceProps = {
  valueInPaise: number;
  className?: string;
};

export function Price({ valueInPaise, className }: PriceProps) {
  const value = Number.isFinite(valueInPaise) ? valueInPaise : 0;
  const formatted = (value / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return <span className={`font-mono tracking-[0.03em] ${className ?? ""}`.trim()}>₹ {formatted}</span>;
}
