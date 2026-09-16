import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      { id: 1, title: "Action Proposal Requires Lead Review", desc: "Dependency Agent proposed blocking rule for DCE-104.", time: "10 mins ago", unread: true },
      { id: 2, title: "New Risk Identified: Cross-Region Partition", desc: "Risk Agent flagged RSK-01 during automated daily scan.", time: "42 mins ago", unread: true },
    ],
  });
}
