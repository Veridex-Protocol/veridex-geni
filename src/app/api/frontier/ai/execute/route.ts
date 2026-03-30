import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Missing GOOGLE_API_KEY." }, { status: 400 });
    }

    process.env.GOOGLE_API_KEY = apiKey;
    const { frontierLangGraph } = await import("@/lib/frontierguard/ai");
    
    const body = await req.json();
    const { missionId, prompt, rail, budgetUsd } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const initialState = {
      messages: [new HumanMessage(prompt)],
      missionId: missionId || "demo-001",
      rail: rail || "immediate",
      budgetUsd: budgetUsd || 50,
      spentUsd: 0,
    };

    const finalState = await frontierLangGraph.invoke(initialState);
    
    return NextResponse.json({
        missionId: finalState.missionId,
        tasksCompleted: finalState.tasksCompleted,
        findings: finalState.findings,
        logs: finalState.logs,
        lastMessage: finalState.messages[finalState.messages.length - 1]?.content,
    });
  } catch (error: unknown) {
    console.error("Agentic Engine Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Engine execution failed", details: message },
      { status: 500 }
    );
  }
}
