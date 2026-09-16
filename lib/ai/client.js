/**
 * AI Backend HTTP & Streaming Client
 * Interacts with the Python FastAPI LangGraph microservice.
 */
const AI_BACKEND_URL = process.env.AI_BACKEND_URL || "http://localhost:8000";
const AI_INTERNAL_SECRET = process.env.AI_INTERNAL_SECRET_KEY || "internal_agent_secret_key_change_me";

export async function runAIWorkflow({ workflowType, projectId, inputData }) {
  const response = await fetch(`${AI_BACKEND_URL}/api/workflows/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": AI_INTERNAL_SECRET,
    },
    body: JSON.stringify({
      workflow_type: workflowType,
      project_id: projectId,
      input_data: inputData,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI Backend Error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function getAIWorkflowStream(workflowType, projectId, inputData) {
  const response = await fetch(`${AI_BACKEND_URL}/api/workflows/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": AI_INTERNAL_SECRET,
    },
    body: JSON.stringify({
      workflow_type: workflowType,
      project_id: projectId,
      input_data: inputData,
    }),
  });

  if (!response.ok) {
    throw new Error(`Stream init failed with status: ${response.status}`);
  }

  return response.body;
}

export async function checkAIHealth() {
  try {
    const res = await fetch(`${AI_BACKEND_URL}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
