import { NextResponse } from "next/server";

export function errorResponse(code: string, message: string, status: number, extra?: unknown) {
  return NextResponse.json(
    extra
      ? {
          error: {
            code,
            message,
            ...((typeof extra === "object" && extra !== null ? extra : { details: extra }) as object),
          },
        }
      : { error: { code, message } },
    { status },
  );
}

export function parsePositiveInt(value: string | null, fallback: number, max = 100) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}
