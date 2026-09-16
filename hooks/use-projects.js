"use client";

import { useState, useEffect } from "react";

export function useProjects() {
  const [projects, setProjects] = useState([
    {
      id: "proj-101",
      name: "Distributed Consensus Engine",
      keyPrefix: "DCE",
      description: "Raft-based multi-region state machine with LangGraph automated incident triage.",
      taskCount: 42,
      riskCount: 2,
      health: "Optimal",
    },
    {
      id: "proj-102",
      name: "Autonomous RAG Knowledge Mesh",
      keyPrefix: "RAG",
      description: "PostgreSQL pgvector neural indexer with Gemini embedding ingestion pipeline.",
      taskCount: 29,
      riskCount: 1,
      health: "Active",
    },
    {
      id: "proj-103",
      name: "Edge API Gateway & Rate Limiter",
      keyPrefix: "EGW",
      description: "Zero-latency Cloudflare Worker proxy with Redis token-bucket rate limiting.",
      taskCount: 15,
      riskCount: 0,
      health: "Active",
    },
  ]);
  const [loading, setLoading] = useState(false);

  return { projects, loading };
}
