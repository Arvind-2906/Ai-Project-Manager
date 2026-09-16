import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    try {
      const risks = await prisma.risk.findMany({
        where: projectId ? { projectId } : undefined,
        orderBy: { severity: "desc" },
      });
      return NextResponse.json({ success: true, data: risks });
    } catch {
      return NextResponse.json({
        success: true,
        data: [
          {
            id: "RSK-01",
            title: "Potential Raft split-brain during cross-region partition",
            severity: "CRITICAL",
            likelihood: "LOW",
            mitigation: "Introduce quorum heartbeats with exponential backoff and pre-vote phase.",
          },
        ],
      });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
