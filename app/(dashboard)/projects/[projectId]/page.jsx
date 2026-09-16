import { redirect } from "next/navigation";

export default function ProjectRootPage({ params }) {
  const projectId = params?.projectId || "proj-101";
  redirect(`/projects/${projectId}/overview`);
}
