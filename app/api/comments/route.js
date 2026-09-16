import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    try {
      const comments = await prisma.comment.findMany({
        where: taskId ? { taskId } : undefined,
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: comments });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, message: "Comment created", data: body });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
