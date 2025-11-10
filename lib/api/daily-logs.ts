/**
 * Daily Logs API Helper Functions
 * Client-side functions for interacting with daily log endpoints
 */

import { DailyLog, Weather, User } from "@prisma/client";

/**
 * Daily Log with relations
 */
export interface DailyLogWithRelations extends DailyLog {
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
  photoCount?: number;
}

/**
 * Daily Log filters for querying
 */
export interface DailyLogFilters {
  startDate?: Date;
  endDate?: Date;
  weather?: Weather;
  createdBy?: string;
  page?: number;
  limit?: number;
}

/**
 * Daily Log list response
 */
export interface DailyLogListResponse {
  logs: DailyLogWithRelations[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Create daily log data
 */
export interface CreateDailyLogData {
  date: Date;
  weather: Weather;
  activities: string;
  crewNotes?: string;
  photos?: string[];
  assignedToId: string;
}

/**
 * Update daily log data
 */
export interface UpdateDailyLogData {
  weather?: Weather;
  activities?: string;
  crewNotes?: string;
  photos?: string[];
  assignedToId?: string;
}

/**
 * Get all daily logs for a project with filters
 *
 * @param projectId - Project ID
 * @param filters - Optional filters
 * @returns Paginated list of daily logs
 */
export async function getDailyLogs(
  projectId: string,
  filters: DailyLogFilters = {}
): Promise<DailyLogListResponse> {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.append("startDate", filters.startDate.toISOString());
  }
  if (filters.endDate) {
    params.append("endDate", filters.endDate.toISOString());
  }
  if (filters.weather) {
    params.append("weather", filters.weather);
  }
  if (filters.createdBy) {
    params.append("createdBy", filters.createdBy);
  }
  if (filters.page) {
    params.append("page", filters.page.toString());
  }
  if (filters.limit) {
    params.append("limit", filters.limit.toString());
  }

  const response = await fetch(
    `/api/projects/${projectId}/daily-logs?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch daily logs");
  }

  return response.json();
}

/**
 * Get single daily log by ID
 *
 * @param projectId - Project ID
 * @param logId - Daily log ID
 * @returns Daily log with full details
 */
export async function getDailyLog(
  projectId: string,
  logId: string
): Promise<DailyLogWithRelations> {
  const response = await fetch(
    `/api/projects/${projectId}/daily-logs/${logId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch daily log");
  }

  return response.json();
}

/**
 * Create new daily log
 *
 * @param projectId - Project ID
 * @param data - Daily log data
 * @returns Created daily log
 */
export async function createDailyLog(
  projectId: string,
  data: CreateDailyLogData
): Promise<DailyLogWithRelations> {
  const response = await fetch(`/api/projects/${projectId}/daily-logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      date: data.date.toISOString(),
      projectId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create daily log");
  }

  return response.json();
}

/**
 * Update existing daily log
 *
 * @param projectId - Project ID
 * @param logId - Daily log ID
 * @param data - Updated daily log data
 * @returns Updated daily log
 */
export async function updateDailyLog(
  projectId: string,
  logId: string,
  data: UpdateDailyLogData
): Promise<DailyLogWithRelations> {
  const response = await fetch(
    `/api/projects/${projectId}/daily-logs/${logId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update daily log");
  }

  return response.json();
}

/**
 * Delete daily log (soft delete)
 * Also deletes associated photos from Google Drive
 *
 * @param projectId - Project ID
 * @param logId - Daily log ID
 */
export async function deleteDailyLog(
  projectId: string,
  logId: string
): Promise<void> {
  const response = await fetch(
    `/api/projects/${projectId}/daily-logs/${logId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete daily log");
  }
}

/**
 * Get daily logs for a date range
 * Convenience function for filtering by dates
 *
 * @param projectId - Project ID
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns List of daily logs in date range
 */
export async function getDailyLogsByDateRange(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyLogWithRelations[]> {
  const response = await getDailyLogs(projectId, { startDate, endDate });
  return response.logs;
}

/**
 * Get daily logs by weather condition
 * Useful for analyzing weather impact on projects
 *
 * @param projectId - Project ID
 * @param weather - Weather condition
 * @returns List of daily logs with matching weather
 */
export async function getDailyLogsByWeather(
  projectId: string,
  weather: Weather
): Promise<DailyLogWithRelations[]> {
  const response = await getDailyLogs(projectId, { weather });
  return response.logs;
}

/**
 * Get daily logs created by specific user
 *
 * @param projectId - Project ID
 * @param userId - User ID
 * @returns List of daily logs created by user
 */
export async function getDailyLogsByUser(
  projectId: string,
  userId: string
): Promise<DailyLogWithRelations[]> {
  const response = await getDailyLogs(projectId, { createdBy: userId });
  return response.logs;
}

/**
 * Check if daily log exists for a date
 * Used to prevent duplicate logs before creation
 *
 * @param projectId - Project ID
 * @param date - Date to check
 * @returns true if log exists for that date
 */
export async function dailyLogExistsForDate(
  projectId: string,
  date: Date
): Promise<boolean> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await getDailyLogs(projectId, {
      startDate: startOfDay,
      endDate: endOfDay,
      limit: 1,
    });

    return response.total > 0;
  } catch (error) {
    return false;
  }
}
