import type { OrderStatus } from "@prisma/client";
import { Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ORDER_STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

type StepTimestamps = Partial<Record<OrderStatus, string | null | undefined>>;

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCurrentStepIndex(status: OrderStatus) {
  const idx = ORDER_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function OrderTimeline({
  status,
  confirmedAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
  createdAt,
  cancelReason,
  timestamps,
}: {
  status: OrderStatus;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
  cancelReason?: string | null;
  timestamps?: StepTimestamps;
}) {
  const resolvedTimestamps: StepTimestamps = timestamps ?? {
    PENDING: createdAt,
    CONFIRMED: confirmedAt,
    SHIPPED: shippedAt,
    DELIVERED: deliveredAt,
    CANCELLED: cancelledAt,
  };
  const currentIndex = getCurrentStepIndex(status);
  const isCancelled = status === "CANCELLED";
  const cancelledAtLabel = formatDateTime(resolvedTimestamps.CANCELLED);
  const labels: Record<OrderStatus, string> = {
    PENDING: "Placed",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-steel-200/70 bg-alloy-white p-4">
        <div className="mb-3 flex items-center justify-between border-b border-steel-200/70 pb-2">
          <p className="font-display text-lg font-semibold text-iron-800">
            Dispatch timeline
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-steel-500">Live status: {status}</p>
        </div>
        <ol className="space-y-4 md:hidden">
          {ORDER_STEPS.map((step, index) => {
            const complete = !isCancelled && index < currentIndex;
            const isCurrent = !isCancelled && index === currentIndex;
            const isPending = isCancelled || index > currentIndex;
            const timestamp = formatDateTime(resolvedTimestamps[step]);
            const connectorComplete = !isCancelled && index < currentIndex;

            return (
              <li key={step} className="relative pl-10">
                {index < ORDER_STEPS.length - 1 ? (
                  <span
                    className={cn(
                      "absolute left-[0.95rem] top-7 h-[calc(100%+0.5rem)] w-px",
                      connectorComplete ? "bg-primary-700" : "border-l border-dashed border-steel-300",
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "absolute left-0.5 top-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 bg-alloy-white",
                    complete && "border-primary-700 bg-primary-700 text-primary-foreground",
                    isCurrent && "h-8 w-8 border-accent-500 bg-accent-500 text-accent-foreground shadow-[0_0_0_4px_rgba(245,158,11,0.18)]",
                    isPending && "border-steel-300 text-steel-400",
                  )}
                >
                  {complete ? <Check className="h-4 w-4" /> : null}
                  {isCurrent ? <span className="h-2.5 w-2.5 rounded-full bg-accent-foreground/90 animate-pulse" /> : null}
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-sm uppercase tracking-wide text-iron-800">{labels[step]}</p>
                  <p className="text-xs text-steel-500">{timestamp ?? (isPending ? "Pending" : "Updated")}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <ol className="hidden md:flex md:gap-0">
          {ORDER_STEPS.map((step, index) => {
            const complete = !isCancelled && index < currentIndex;
            const isCurrent = !isCancelled && index === currentIndex;
            const isPending = isCancelled || index > currentIndex;
            const timestamp = formatDateTime(resolvedTimestamps[step]);
            const connectorComplete = !isCancelled && index < currentIndex;

            return (
              <li key={step} className="relative flex flex-1 flex-col items-center px-2 text-center">
                {index < ORDER_STEPS.length - 1 ? (
                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-[2rem] h-0.5 w-full",
                      connectorComplete ? "bg-primary-700" : "border-t border-dashed border-steel-300",
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 bg-alloy-white",
                    complete && "border-primary-700 bg-primary-700 text-primary-foreground",
                    isCurrent && "h-9 w-9 border-accent-500 bg-accent-500 text-accent-foreground shadow-[0_0_0_5px_rgba(245,158,11,0.2)]",
                    isPending && "border-steel-300 text-steel-400",
                  )}
                >
                  {complete ? <Check className="h-4 w-4" /> : null}
                  {isCurrent ? <span className="h-2.5 w-2.5 rounded-full bg-accent-foreground/90 animate-pulse" /> : null}
                </span>
                <p
                  className={cn(
                    "mt-3 font-medium text-sm uppercase tracking-wide",
                    isCurrent ? "text-accent-700" : "text-iron-800",
                  )}
                >
                  {labels[step]}
                </p>
                {complete && timestamp ? <p className="mt-1 text-xs text-steel-500">{timestamp}</p> : <div className="mt-1 h-4" />}
              </li>
            );
          })}
        </ol>
      </div>
      {isCancelled ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <XCircle className="h-4 w-4" />
          <span>
            Order cancelled{cancelledAtLabel ? ` on ${cancelledAtLabel}` : ""}
            {cancelReason ? ` (${cancelReason})` : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
