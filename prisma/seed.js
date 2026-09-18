const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting development database seeding on Neon PostgreSQL...");

  // 1. Seed Test User
  const testUser = await prisma.user.upsert({
    where: { email: "lead@enterprise.io" },
    update: {
      name: "Alex Vance",
    },
    create: {
      id: "usr_lead_01",
      name: "Alex Vance",
      email: "lead@enterprise.io",
      emailVerified: true,
      image: "https://avatars.githubusercontent.com/u/10001",
    },
  });
  console.log("  ✓ Seeded User:", testUser.email);

  // 2. Seed Organization
  const org = await prisma.organization.upsert({
    where: { slug: "acme-engineering" },
    update: {
      name: "Acme Engineering Corp",
    },
    create: {
      id: "org_acme_01",
      name: "Acme Engineering Corp",
      slug: "acme-engineering",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
    },
  });
  console.log("  ✓ Seeded Organization:", org.slug);

  // 3. Seed Organization Member
  const orgMember = await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: testUser.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      organizationId: org.id,
      userId: testUser.id,
      role: "OWNER",
    },
  });
  console.log("  ✓ Seeded OrganizationMember role:", orgMember.role);

  // 4. Seed Project
  const project = await prisma.project.upsert({
    where: { key: "DCE" },
    update: {
      name: "Distributed Consensus Engine",
    },
    create: {
      id: "proj_dce_01",
      organizationId: org.id,
      name: "Distributed Consensus Engine",
      key: "DCE",
      description: "High-throughput Raft replication state machine with LangGraph automated operations.",
      status: "ACTIVE",
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      targetDate: new Date("2026-12-31T00:00:00.000Z"),
      createdById: testUser.id,
    },
  });
  console.log("  ✓ Seeded Project:", project.key);

  // 5. Seed Project Member
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: testUser.id,
      },
    },
    update: {
      role: "PROJECT_MANAGER",
    },
    create: {
      projectId: project.id,
      userId: testUser.id,
      role: "PROJECT_MANAGER",
    },
  });
  console.log("  ✓ Seeded ProjectMember role: PROJECT_MANAGER");

  // 6. Seed Requirement
  const requirement = await prisma.requirement.upsert({
    where: { id: "req_dce_01" },
    update: {
      title: "Raft Log Compaction & Snapshotting",
    },
    create: {
      id: "req_dce_01",
      projectId: project.id,
      title: "Raft Log Compaction & Snapshotting",
      description: "Mandatory non-blocking snapshot streaming when WAL segment exceeds 64MB.",
      type: "FUNCTIONAL",
      priority: "CRITICAL",
      status: "APPROVED",
      acceptanceCriteria: [
        "Snapshot writing must not exceed 5ms P99 latency impact on heartbeat.",
        "Peer node must recover from snapshot in under 30 seconds.",
      ],
      businessGoal: "Prevent node storage exhaustion in multi-region deployments.",
      createdById: testUser.id,
    },
  });
  console.log("  ✓ Seeded Requirement:", requirement.title);

  // 7. Seed Epic
  const epic = await prisma.epic.upsert({
    where: { id: "epic_dce_01" },
    update: {
      title: "State Replication & Compaction Infrastructure",
    },
    create: {
      id: "epic_dce_01",
      projectId: project.id,
      title: "State Replication & Compaction Infrastructure",
      description: "Core consensus primitives and log durability protocols.",
      status: "IN_PROGRESS",
      priority: "HIGH",
    },
  });
  console.log("  ✓ Seeded Epic:", epic.title);

  // 8. Seed Feature
  const feature = await prisma.feature.upsert({
    where: { id: "feat_dce_01" },
    update: {
      title: "Snapshot Stream Chunking Protocol",
    },
    create: {
      id: "feat_dce_01",
      epicId: epic.id,
      title: "Snapshot Stream Chunking Protocol",
      description: "Segmented gRPC streaming transport for state machine snapshots.",
      status: "IN_PROGRESS",
      priority: "HIGH",
    },
  });
  console.log("  ✓ Seeded Feature:", feature.title);

  // 9. Seed User Story
  const story = await prisma.userStory.upsert({
    where: { id: "story_dce_01" },
    update: {
      title: "As an SRE, I want automatic snapshot triggers at 64MB WAL ceiling",
      priority: "URGENT",
    },
    create: {
      id: "story_dce_01",
      featureId: feature.id,
      title: "As an SRE, I want automatic snapshot triggers at 64MB WAL ceiling",
      description: "Enable background compaction thread without stopping inbound write traffic.",
      acceptanceCriteria: [
        "Triggers automatically upon 64MB disk boundary",
        "Emits OpenTelemetry audit span with start/finish timestamps",
      ],
      priority: "URGENT",
      status: "IN_PROGRESS",
      storyPoints: 8,
      assigneeId: testUser.id,
    },
  });
  console.log("  ✓ Seeded UserStory:", story.title);

  // 10. Seed Tasks & Subtasks
  const taskParent = await prisma.task.upsert({
    where: { id: "task_dce_101" },
    update: {
      title: "Implement Snapshot Disk Writer Worker",
    },
    create: {
      id: "task_dce_101",
      projectId: project.id,
      userStoryId: story.id,
      title: "Implement Snapshot Disk Writer Worker",
      description: "Async background worker spooling compressed WAL states to persistent volume.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      type: "FEATURE",
      assigneeId: testUser.id,
      reporterId: testUser.id,
      storyPoints: 5,
      estimatedHours: 16.0,
      actualHours: 6.5,
      startedAt: new Date("2026-09-10T10:00:00.000Z"),
    },
  });

  const taskSubtask = await prisma.task.upsert({
    where: { id: "task_dce_102" },
    update: {
      title: "Add fsync sync barrier after snapshot chunk write",
    },
    create: {
      id: "task_dce_102",
      projectId: project.id,
      userStoryId: story.id,
      parentTaskId: taskParent.id,
      title: "Add fsync sync barrier after snapshot chunk write",
      description: "Ensure kernel buffer write cache is flushed to NVMe disk.",
      status: "TODO",
      priority: "HIGH",
      type: "TASK",
      assigneeId: testUser.id,
      reporterId: testUser.id,
      storyPoints: 2,
      estimatedHours: 4.0,
    },
  });

  const taskDependent = await prisma.task.upsert({
    where: { id: "task_dce_103" },
    update: {
      title: "Expose Snapshot Streaming gRPC API Endpoint",
    },
    create: {
      id: "task_dce_103",
      projectId: project.id,
      userStoryId: story.id,
      title: "Expose Snapshot Streaming gRPC API Endpoint",
      description: "Peer-to-peer snapshot stream transport endpoint.",
      status: "BACKLOG",
      priority: "HIGH",
      type: "FEATURE",
      reporterId: testUser.id,
      storyPoints: 5,
      estimatedHours: 12.0,
    },
  });
  console.log("  ✓ Seeded Tasks:", taskParent.id, taskSubtask.id, taskDependent.id);

  // 11. Seed Task Dependency
  await prisma.dependency.upsert({
    where: {
      sourceTaskId_targetTaskId: {
        sourceTaskId: taskParent.id,
        targetTaskId: taskDependent.id,
      },
    },
    update: {
      type: "BLOCKS",
    },
    create: {
      id: "dep_dce_01",
      projectId: project.id,
      sourceTaskId: taskParent.id,
      targetTaskId: taskDependent.id,
      type: "BLOCKS",
      createdById: testUser.id,
    },
  });
  console.log("  ✓ Seeded Dependency: task_dce_101 BLOCKS task_dce_103");

  // 12. Seed Sprint & Sprint Task
  const sprint = await prisma.sprint.upsert({
    where: { id: "sprint_dce_04" },
    update: {
      name: "Sprint 4 - Compaction Primitives",
    },
    create: {
      id: "sprint_dce_04",
      projectId: project.id,
      name: "Sprint 4 - Compaction Primitives",
      goal: "Finalize snapshot writer and verify zero message loss during partition failover.",
      status: "ACTIVE",
      startDate: new Date("2026-09-08T00:00:00.000Z"),
      endDate: new Date("2026-09-22T00:00:00.000Z"),
      capacity: 36,
    },
  });

  await prisma.sprintTask.upsert({
    where: {
      sprintId_taskId: {
        sprintId: sprint.id,
        taskId: taskParent.id,
      },
    },
    update: {},
    create: {
      id: "st_01",
      sprintId: sprint.id,
      taskId: taskParent.id,
    },
  });

  await prisma.sprintTask.upsert({
    where: {
      sprintId_taskId: {
        sprintId: sprint.id,
        taskId: taskSubtask.id,
      },
    },
    update: {},
    create: {
      id: "st_02",
      sprintId: sprint.id,
      taskId: taskSubtask.id,
    },
  });
  console.log("  ✓ Seeded Sprint & assigned tasks to Sprint 4");

  // 13. Seed Risk & RiskAction
  const risk = await prisma.risk.upsert({
    where: { id: "rsk_dce_01" },
    update: {
      title: "Cross-region network partition during heavy snapshot transfer",
    },
    create: {
      id: "rsk_dce_01",
      projectId: project.id,
      title: "Cross-region network partition during heavy snapshot transfer",
      description: "Large chunk transmissions may consume bandwidth and delay election heartbeats.",
      severity: "CRITICAL",
      probability: 0.3,
      impact: 0.9,
      status: "OPEN",
      detectedBy: "AI Risk Agent",
      ownerId: testUser.id,
    },
  });

  await prisma.riskAction.upsert({
    where: { id: "ract_dce_01" },
    update: {
      status: "IN_PROGRESS",
    },
    create: {
      id: "ract_dce_01",
      riskId: risk.id,
      description: "Implement bandwidth throttling at 50MB/s on peer streaming sockets.",
      status: "IN_PROGRESS",
      assignedToId: testUser.id,
      dueDate: new Date("2026-09-20T00:00:00.000Z"),
    },
  });
  console.log("  ✓ Seeded Risk & Risk Action:", risk.title);

  // 14. Seed AI Agent Definition
  const supervisorAgent = await prisma.agent.upsert({
    where: { id: "agent_supervisor_01" },
    update: {
      name: "Chief Engineering Supervisor",
    },
    create: {
      id: "agent_supervisor_01",
      projectId: project.id,
      type: "SUPERVISOR",
      name: "Chief Engineering Supervisor",
      description: "Orchestrates SDLC workflows, task decomposition, and human approval checkpoints.",
      enabled: true,
    },
  });
  console.log("  ✓ Seeded AI Agent:", supervisorAgent.name);

  // 15. Seed ActivityLog
  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      userId: testUser.id,
      actorType: "SYSTEM",
      action: "PROJECT_INITIALIZED",
      entityType: "PROJECT",
      entityId: project.id,
      metadata: { initialSprint: sprint.name, key: project.key },
    },
  });
  console.log("  ✓ Seeded ActivityLog");

  console.log("\n🚀 Database seeding on Neon PostgreSQL completed successfully with 0 errors!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
