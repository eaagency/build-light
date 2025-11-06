import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          Welcome back, {user?.firstName || "there"}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what's happening with your construction projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Projects
            </h3>
            <span className="text-2xl">🏗️</span>
          </div>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Team Members
            </h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-primary">1</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Completed
            </h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
      </div>

      {/* Projects Section - Empty State */}
      <div className="bg-card border border-border rounded-xl p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-5xl">🏗️</span>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">
              No projects yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first construction project. It only
              takes a minute to set up.
            </p>
          </div>
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
            Create First Project
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-primary mb-2">
            📚 Getting Started Guide
          </h3>
          <p className="text-muted-foreground mb-4">
            Learn how to set up your first project and invite team members.
          </p>
          <Link
            href="#"
            className="text-accent hover:text-accent/90 font-medium"
          >
            Read guide →
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-primary mb-2">
            👥 Invite Team
          </h3>
          <p className="text-muted-foreground mb-4">
            Collaborate with your team by inviting members to your
            organization.
          </p>
          <Link
            href="/dashboard/team"
            className="text-accent hover:text-accent/90 font-medium"
          >
            Invite members →
          </Link>
        </div>
      </div>
    </div>
  );
}
