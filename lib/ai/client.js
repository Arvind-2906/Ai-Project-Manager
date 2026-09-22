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
      "x-internal-secret": AI_INTERNAL_SECRET,
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
      "x-internal-secret": AI_INTERNAL_SECRET,
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

export async function createProjectAI({ projectId, rawIdea, businessContext = "", constraints = [], targetAudience = "" }) {
  const response = await fetch(`${AI_BACKEND_URL}/ai/project/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": AI_INTERNAL_SECRET,
    },
    body: JSON.stringify({
      project_id: projectId,
      raw_idea: rawIdea,
      business_context: businessContext,
      constraints,
      target_audience: targetAudience,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI Backend Project Create Error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function planSprintAI({ projectId, sprintName, teamCapacityPoints = 40, durationWeeks = 2, priorities = [] }) {
  const response = await fetch(`${AI_BACKEND_URL}/ai/sprint/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": AI_INTERNAL_SECRET,
    },
    body: JSON.stringify({
      project_id: projectId,
      sprint_name: sprintName,
      team_capacity_points: teamCapacityPoints,
      duration_weeks: durationWeeks,
      priorities,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI Backend Sprint Plan Error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function analyzeRiskAI({ projectId, scope = "FULL_PROJECT", riskThreshold = 5 }) {
  const response = await fetch(`${AI_BACKEND_URL}/ai/risk/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": AI_INTERNAL_SECRET,
    },
    body: JSON.stringify({
      project_id: projectId,
      scope,
      risk_threshold: riskThreshold,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI Backend Risk Analyze Error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function analyzeSupervisorAI({ projectId, triggerEvent = "MANUAL_CHECK", context = {} }) {
  const response = await fetch(`${AI_BACKEND_URL}/ai/supervisor/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": AI_INTERNAL_SECRET,
    },
    body: JSON.stringify({
      project_id: projectId,
      trigger_event: triggerEvent,
      context,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI Backend Supervisor Analyze Error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function checkAIHealth() {
  try {
    const res = await fetch(`${AI_BACKEND_URL}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
