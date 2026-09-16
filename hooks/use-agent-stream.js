"use client";

import { useState, useCallback } from "react";

export function useAgentStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const startStream = useCallback(async ({ workflowType, projectId, inputData }) => {
    setIsStreaming(true);
    setError(null);
    setLogs([]);

    try {
      const response = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowType, projectId, inputData }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize stream: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.replace("data: ", ""));
              setLogs((prev) => [...prev, parsed]);
            } catch (e) {
              // Ignore malformed ping or comment lines
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { isStreaming, logs, error, startStream };
}
