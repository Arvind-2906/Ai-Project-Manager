const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding enterprise database...");

  // Seed default Admin / Staff Engineer
  const user = await prisma.user.upsert({
    where: { email: "lead@enterprise.io" },
    update: {},
    create: {
      id: "usr-admin-01",
      name: "Arvind Kumar",
      email: "lead@enterprise.io",
      role: "STAFF_ENGINEER",
    },
  });

  // Seed Organization
  const org = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      id: "org-default",
      name: "Acme Engineering Corp",
      slug: "acme-corp",
      description: "Autonomous engineering workspaces",
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  // Seed Flagship Project
  const project = await prisma.project.upsert({
    where: { key: "DCE" },
    update: {},
    create: {
      id: "proj-101",
      name: "Distributed Consensus Engine",
      key: "DCE",
      description: "Raft-based multi-region state machine with LangGraph automated incident triage.",
      organizationId: org.id,
    },
  });

  // Seed Active Sprint
  const sprint = await prisma.sprint.create({
    data: {
      id: "sprint-4",
      name: "Sprint 4",
      goal: "Core Consensus Engine & State Replication",
      status: "ACTIVE",
      capacityPoints: 36,
      committedPoints: 34,
      projectId: project.id,
    },
  });

  // Seed Initial Tasks
  const task1 = await prisma.task.create({
    data: {
      id: "DCE-103",
      title: "Configure pgvector vector store collection for PRD semantic search",
      priority: "HIGH",
      points: 5,
      status: "TODO",
      projectId: project.id,
      sprintId: sprint.id,
      agentGenerated: true,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      id: "DCE-104",
      title: "Implement Raft Log Compaction with Snapshot Stream",
      priority: "CRITICAL",
      points: 8,
      status: "IN_PROGRESS",
      projectId: project.id,
      sprintId: sprint.id,
      assigneeId: user.id,
      agentGenerated: true,
    },
  });

  // Seed Risk
  await prisma.risk.create({
    data: {
      id: "RSK-01",
      title: "Potential Raft split-brain during cross-region partition",
      severity: "CRITICAL",
      likelihood: "LOW",
      mitigation: "Introduce quorum heartbeats with exponential backoff and pre-vote phase.",
      projectId: project.id,
      agentDetected: "Risk Agent",
    },
  });

  console.log("✅ Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
