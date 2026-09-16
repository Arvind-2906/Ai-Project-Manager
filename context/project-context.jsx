"use client";

import React, { createContext, useContext, useState } from "react";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [activeProjectId, setActiveProjectId] = useState("proj-101");
  const [activeProject, setActiveProject] = useState({
    id: "proj-101",
    name: "Distributed Consensus Engine",
    keyPrefix: "DCE",
  });

  return (
    <ProjectContext.Provider
      value={{ activeProjectId, setActiveProjectId, activeProject, setActiveProject }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
