"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within <Dialog />");
  }
  return context;
}

export function Dialog({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ onClick?: React.MouseEventHandler }>,
      {
        onClick: (event: React.MouseEvent) => {
          (children.props as { onClick?: React.MouseEventHandler }).onClick?.(event);
          setOpen(true);
        },
      },
    );
  }

  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

export function DialogClose({
  children,
  asChild,
  className,
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const { setOpen } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ onClick?: React.MouseEventHandler; className?: string }>,
      {
        className: cn(className, (children.props as { className?: string }).className),
        onClick: (event: React.MouseEvent) => {
          (children.props as { onClick?: React.MouseEventHandler }).onClick?.(event);
          setOpen(false);
        },
      },
    );
  }

  return (
    <button type="button" className={className} onClick={() => setOpen(false)}>
      {children}
    </button>
  );
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, setOpen } = useDialogContext();
  const [mounted, setMounted] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    let frame: number | undefined;
    let hideTimeout: number | undefined;

    if (open) {
      setShouldRender(true);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      hideTimeout = window.setTimeout(() => setShouldRender(false), 150);
    }

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      if (hideTimeout) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, [mounted, open]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!mounted || !shouldRender) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn("absolute inset-0 bg-black/40 transition-opacity duration-150", isVisible ? "opacity-100" : "opacity-0")}
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-md border border-steel-200 bg-white p-5 shadow-lg transition-all duration-150",
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-[0.98] opacity-0",
          className,
        )}
      >
        <DialogClose className="absolute right-3 top-3 rounded-sm p-1 text-steel-500 hover:bg-steel-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-3 space-y-1", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}

export function DialogDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("text-sm text-steel-600", className)}>{children}</p>;
}
