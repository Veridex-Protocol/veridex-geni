import { NextResponse } from "next/server";
import { getFlowScheduleStatus } from "@/lib/frontierguard/integrations/flow";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    missionId: string;
    scheduleId: string;
    operatorWallet?: string;
  };

  const result = await getFlowScheduleStatus(body);
  return NextResponse.json(result);
}
