import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ checkoutId: string }> },
) {
  const { checkoutId } = await params;

  return NextResponse.json({
    checkout_id: checkoutId,
    status: "completed",
    provider: "veridex",
  });
}
