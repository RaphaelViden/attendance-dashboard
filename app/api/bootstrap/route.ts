import { NextResponse } from "next/server";
import { getBootstrap } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getBootstrap());
}
