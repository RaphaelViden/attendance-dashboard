import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: unknown, fallback = "Request failed") {
  const err = error as { message?: string; status?: number };
  return NextResponse.json({ error: err?.message || fallback }, { status: err?.status || 500 });
}
