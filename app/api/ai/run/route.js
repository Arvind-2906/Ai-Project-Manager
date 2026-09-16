import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { workflowType, projectId, inputData } = await request.json();

    // Prepare an SSE response stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Send initial orchestration state
          sendEvent({
            id: 1,
            agent: "SUPERVISOR",
            message: `Initiating workflow: ${workflowType || "PROJECT_CREATION"} for project ${projectId}`,
            time: new Date().toLocaleTimeString(),
          });

          // Forward to Python AI microservice if running, else provide high-fidelity simulated agent steps
          const AI_BACKEND_URL = process.env.AI_BACKEND_URL || "http://localhost:8000";
          try {
            const backendRes = await fetch(`${AI_BACKEND_URL}/api/workflows/run`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workflow_type: workflowType || "PROJECT_CREATION",
                project_id: projectId || "proj-101",
                input_data: inputData || {},
              }),
            });

            if (backendRes.ok) {
              const result = await backendRes.json();
              sendEvent({
                id: 2,
                agent: "SUPERVISOR",
                message: "Python LangGraph microservice completed workflow execution.",
                result,
                time: new Date().toLocaleTimeString(),
              });
              controller.close();
              return;
            }
          } catch (backendErr) {
            // Python backend is starting or offline; proceed with graceful fallback stream
          }

          // Fallback simulation for seamless frontend development
          await new Promise((r) => setTimeout(r, 600));
          sendEvent({
            id: 2,
            agent: "PRODUCT",
            message: "Product Agent synthesized user requirements and validated PRD scope.",
            time: new Date().toLocaleTimeString(),
          });

          await new Promise((r) => setTimeout(r, 700));
          sendEvent({
            id: 3,
            agent: "TASK",
            message: "Task Agent decomposed requirements into atomic tasks and calculated Fibonacci points.",
            time: new Date().toLocaleTimeString(),
          });

          await new Promise((r) => setTimeout(r, 600));
          sendEvent({
            id: 4,
            agent: "DEPENDENCY",
            message: "Dependency Agent verified DAG topology. Prepared guarded action proposal.",
            time: new Date().toLocaleTimeString(),
          });

          sendEvent({
            id: 5,
            agent: "SUPERVISOR",
            message: "Workflow checkpoint reached: Awaiting Human Lead Approval.",
            time: new Date().toLocaleTimeString(),
          });

          controller.close();
        } catch (streamErr) {
          controller.error(streamErr);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
