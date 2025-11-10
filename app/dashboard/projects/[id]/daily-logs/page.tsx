"use client";

import { use, useState, useEffect } from "react";
import { NewDailyLogButton } from "@/components/daily-logs/new-log-button";
import { CreateDailyLogModal } from "@/components/daily-logs/create-daily-log-modal";
import { getDailyLogs } from "@/lib/api/daily-logs";
import { DailyLogWithRelations } from "@/lib/api/daily-logs";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function DailyLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Fetch daily logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await getDailyLogs(projectId);
      setLogs(response.logs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team members and current user
  const fetchTeamData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.project) {
        // Get team members from project
        const members = data.project.members?.map((m: any) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        })) || [];

        setTeamMembers(members);
      }

      // Get current user ID (from Clerk session)
      const userResponse = await fetch("/api/user");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUserId(userData.user?.id);
      }
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchTeamData();
  }, [projectId]);

  const handleSuccess = () => {
    fetchLogs(); // Refresh logs after creation
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Daily Logs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Document daily progress, photos, and site conditions
          </p>
        </div>

        {/* Desktop button */}
        <NewDailyLogButton onClick={() => setIsModalOpen(true)} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg
              className="animate-spin h-10 w-10 text-[#6BF178] mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">Loading logs...</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        // Empty state
        <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No daily logs yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start documenting your daily progress by creating your first log.
            Add photos, weather conditions, and notes about the day's work.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#6BF178] text-gray-900 rounded-lg hover:bg-[#5DE068] font-medium transition-colors"
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
            Create Your First Daily Log
          </button>
        </div>
      ) : (
        // Logs list (placeholder - will build in next prompt)
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {new Date(log.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    By {log.createdBy.name || log.createdBy.email}
                  </p>
                </div>
                {log.weather && (
                  <span className="text-2xl">{log.weather}</span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                {log.activities}
              </p>
              {log.photoCount && log.photoCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  📷 {log.photoCount} photo{log.photoCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <NewDailyLogButton onClick={() => setIsModalOpen(true)} mobile />

      {/* Modal */}
      <CreateDailyLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        teamMembers={teamMembers}
        currentUserId={currentUserId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
