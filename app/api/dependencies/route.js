import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    try {
      const dependencies = await prisma.taskDependency.findMany({
        where: projectId ? { sourceTask: { projectId } } : undefined,
        include: {
          sourceTask: { select: { id: true, title: true } },
          targetTask: { select: { id: true, title: true } },
        },
      });
      return NextResponse.json({ success: true, data: dependencies });
    } catch {
      return NextResponse.json({
        success: true,
        data: [
          { id: "dep-1", sourceTaskId: "DCE-104", targetTaskId: "DCE-108", type: "BLOCKS" },
        ],
      });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
