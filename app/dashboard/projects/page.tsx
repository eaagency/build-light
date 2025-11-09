import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/empty-state";
import { hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";

async function getProjects() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/projects`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export default async function ProjectsPage() {
  const user = await currentUser();
  const canCreate = await hasRole(Role.PROJECT_MANAGER);
  const projects = await getProjects();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">Projects</h1>
          <p className="text-muted-foreground text-lg">
            Manage your construction projects
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Project
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-card border border-border rounded-xl">
          <EmptyState
            icon="🏗️"
            title="No projects yet"
            description={
              canCreate
                ? "Create your first project to get started tracking construction progress"
                : "You haven't been assigned to any projects yet. Contact your project manager."
            }
            actionLabel={canCreate ? "Create First Project" : undefined}
            actionHref={canCreate ? "/dashboard/projects/new" : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              address={project.address}
              status={project.status}
              clientName={project.clientName}
              memberCount={project.members?.length || 0}
              dailyLogCount={project._count?.dailyLogs || 0}
              documentCount={project._count?.documents || 0}
              updatedAt={new Date(project.updatedAt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
