import Link from "next/link";
import { ProjectStatus } from "@/lib/types";

interface ProjectCardProps {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  clientName?: string;
  memberCount?: number;
  dailyLogCount?: number;
  documentCount?: number;
  updatedAt: Date;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string }
> = {
  PLANNING: {
    label: "Planning",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  ON_HOLD: {
    label: "On Hold",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
  },
};

export function ProjectCard({
  id,
  name,
  address,
  status,
  clientName,
  memberCount = 0,
  dailyLogCount = 0,
  documentCount = 0,
  updatedAt,
}: ProjectCardProps) {
  const statusInfo = statusConfig[status];

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Link
      href={`/dashboard/projects/${id}`}
      className="block bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-accent/50 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-primary mb-1 line-clamp-1">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
            📍 {address}
          </p>
          {clientName && (
            <p className="text-sm text-muted-foreground">
              Client: {clientName}
            </p>
          )}
        </div>
        <span
          className={`${statusInfo.bgColor} ${statusInfo.color} px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap`}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 py-4 border-t border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{memberCount}</div>
          <div className="text-xs text-muted-foreground">Team</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{dailyLogCount}</div>
          <div className="text-xs text-muted-foreground">Logs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{documentCount}</div>
          <div className="text-xs text-muted-foreground">Files</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mt-4">
        Updated {formatDate(updatedAt)}
      </div>
    </Link>
  );
}
