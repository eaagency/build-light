"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { DocumentBrowser } from "@/components/document-browser";

type Tab = "overview" | "schedule" | "logs" | "documents" | "team";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project");
      }

      setProject(data.project);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-card border border-border rounded-xl">
          <EmptyState
            icon="⚠️"
            title="Project not found"
            description={error || "The project you're looking for doesn't exist or you don't have access to it."}
            actionLabel="Back to Projects"
            actionHref="/dashboard/projects"
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: "📊" },
    { id: "schedule" as Tab, label: "Schedule", icon: "📅" },
    { id: "logs" as Tab, label: "Daily Logs", icon: "📝" },
    { id: "documents" as Tab, label: "Documents", icon: "📄" },
    { id: "team" as Tab, label: "Team", icon: "👥" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/projects"
          className="text-accent hover:text-accent/90 font-medium inline-flex items-center gap-2 mb-4"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              {project.name}
            </h1>
            <p className="text-muted-foreground text-lg mb-2">
              📍 {project.address}
            </p>
            {project.clientName && (
              <p className="text-muted-foreground">
                Client: {project.clientName}
              </p>
            )}
          </div>
          <span className="bg-accent/10 text-accent px-4 py-2 rounded-lg font-medium">
            {project.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-8">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Project Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-foreground mt-1">
                  {project.description || "No description provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Budget
                </label>
                <p className="text-foreground mt-1">
                  {project.budget
                    ? `$${parseFloat(project.budget).toLocaleString()}`
                    : "Not set"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Start Date
                </label>
                <p className="text-foreground mt-1">
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  End Date
                </label>
                <p className="text-foreground mt-1">
                  {project.endDate
                    ? new Date(project.endDate).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          {project.clientName && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">
                Client Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-foreground mt-1">{project.clientName}</p>
                </div>
                {project.clientEmail && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-foreground mt-1">
                      {project.clientEmail}
                    </p>
                  </div>
                )}
                {project.clientPhone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <p className="text-foreground mt-1">
                      {project.clientPhone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="bg-card border border-border rounded-xl">
          <EmptyState
            icon="📅"
            title="No schedule yet"
            description="Create a schedule to manage project tasks and timelines"
            actionLabel="Create Schedule"
            onAction={() => alert("Schedule feature coming soon!")}
          />
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-card border border-border rounded-xl">
          <EmptyState
            icon="📝"
            title="No daily logs yet"
            description="Add your first daily log to track progress, weather, and site conditions"
            actionLabel="Add Daily Log"
            onAction={() => alert("Daily logs feature coming soon!")}
          />
        </div>
      )}

      {activeTab === "documents" && (
        <DocumentBrowser projectId={id} projectName={project.name} />
      )}

      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Team Members
            </h2>
            <div className="space-y-3">
              {project.members && project.members.length > 0 ? (
                project.members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                      {member.role.replace("_", " ")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No team members yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
