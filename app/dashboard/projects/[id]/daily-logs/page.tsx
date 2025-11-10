"use client";

import { use, useState, useEffect, useCallback } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { Weather } from "@prisma/client";
import { NewDailyLogButton } from "@/components/daily-logs/new-log-button";
import { CreateDailyLogModal } from "@/components/daily-logs/create-daily-log-modal";
import { EditDailyLogModal } from "@/components/daily-logs/edit-daily-log-modal";
import { DailyLogFilters, DailyLogFiltersState } from "@/components/daily-logs/daily-log-filters";
import { DailyLogsTimeline } from "@/components/daily-logs/daily-logs-timeline";
import { EmptyState } from "@/components/daily-logs/empty-state";
import { getDailyLogs, deleteDailyLog } from "@/lib/api/daily-logs";
import { DailyLogWithRelations, DailyLogFilters as APIFilters } from "@/lib/api/daily-logs";
import { show } from "@/lib/toast";

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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DailyLogWithRelations | null>(null);
  const [deleteConfirmLog, setDeleteConfirmLog] = useState<DailyLogWithRelations | null>(null);

  // Data states
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [filters, setFilters] = useState<DailyLogFiltersState>({
    dateRange: "7days",
    startDate: startOfDay(subDays(new Date(), 7)),
    endDate: endOfDay(new Date()),
    weather: [],
    createdBy: [],
    search: "",
  });

  // Fetch daily logs with filters
  const fetchLogs = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const apiFilters: APIFilters = {
        page,
        limit: 20,
      };

      // Add date range
      if (filters.startDate) {
        apiFilters.startDate = filters.startDate;
      }
      if (filters.endDate) {
        apiFilters.endDate = filters.endDate;
      }

      // Add weather filter (only first one for now, API needs to support multiple)
      if (filters.weather.length > 0) {
        apiFilters.weather = filters.weather[0];
      }

      // Add creator filter (only first one for now, API needs to support multiple)
      if (filters.createdBy.length > 0) {
        apiFilters.createdBy = filters.createdBy[0];
      }

      const response = await getDailyLogs(projectId, apiFilters);

      // Filter by search on client side (if API doesn't support it)
      let filteredLogs = response.logs;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLogs = response.logs.filter((log) => {
          const activitiesMatch = log.activities.toLowerCase().includes(searchLower);
          const crewNotesMatch = log.crewNotes?.toLowerCase().includes(searchLower);
          return activitiesMatch || crewNotesMatch;
        });
      }

      if (append) {
        setLogs((prev) => [...prev, ...filteredLogs]);
      } else {
        setLogs(filteredLogs);
      }

      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      show("Failed to load daily logs", { icon: "❌" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [projectId, filters]);

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

      // Get current user ID
      const userResponse = await fetch("/api/user");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUserId(userData.user?.id);
      }
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTeamData();
  }, [projectId]);

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs(1, false);
  }, [fetchLogs]);

  // Handlers
  const handleSuccess = () => {
    fetchLogs(1, false); // Refresh logs after creation/edit
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedLog(null);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchLogs(currentPage + 1, true);
    }
  };

  const handleEdit = (log: DailyLogWithRelations) => {
    setSelectedLog(log);
    setIsEditModalOpen(true);
  };

  const handleDelete = (log: DailyLogWithRelations) => {
    setDeleteConfirmLog(log);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmLog) return;

    try {
      await deleteDailyLog(projectId, deleteConfirmLog.id);
      show("Daily log deleted successfully", { icon: "✅" });
      setDeleteConfirmLog(null);
      fetchLogs(1, false); // Refresh logs
    } catch (error: any) {
      console.error("Failed to delete log:", error);
      show(error.message || "Failed to delete daily log", { icon: "❌" });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      dateRange: "7days",
      startDate: startOfDay(subDays(new Date(), 7)),
      endDate: endOfDay(new Date()),
      weather: [],
      createdBy: [],
      search: "",
    });
  };

  const hasActiveFilters = filters.weather.length > 0 || filters.createdBy.length > 0 || filters.search;
  const showEmptyState = !loading && logs.length === 0 && !hasActiveFilters;
  const showNoResults = !loading && logs.length === 0 && hasActiveFilters;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Daily Logs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Document daily progress, photos, and site conditions
          </p>
        </div>

        {/* Desktop button */}
        <NewDailyLogButton onClick={() => setIsCreateModalOpen(true)} />
      </div>

      {/* Filters */}
      {!showEmptyState && (
        <div className="mb-6">
          <DailyLogFilters
            filters={filters}
            onFiltersChange={setFilters}
            teamMembers={teamMembers}
            isLoading={loading}
          />
        </div>
      )}

      {/* Content */}
      {showEmptyState ? (
        // Empty state - no logs at all
        <EmptyState
          type="no-logs"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        // Timeline
        <DailyLogsTimeline
          logs={logs}
          isLoading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          currentUserId={currentUserId}
          teamMembers={teamMembers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoadingMore={loadingMore}
          noResults={showNoResults}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Mobile FAB */}
      <NewDailyLogButton onClick={() => setIsCreateModalOpen(true)} mobile />

      {/* Create Modal */}
      <CreateDailyLogModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
        teamMembers={teamMembers}
        currentUserId={currentUserId}
        onSuccess={handleSuccess}
      />

      {/* Edit Modal */}
      <EditDailyLogModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLog(null);
        }}
        projectId={projectId}
        log={selectedLog}
        teamMembers={teamMembers}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmLog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDeleteConfirmLog(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Daily Log?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete this daily log?
                {deleteConfirmLog.photos.length > 0 && (
                  <span className="block mt-2 font-medium text-red-600">
                    This will also delete {deleteConfirmLog.photos.length} photo
                    {deleteConfirmLog.photos.length !== 1 ? "s" : ""}.
                  </span>
                )}
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmLog(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
