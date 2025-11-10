/**
 * Schedule Export API Endpoint
 * POST /api/projects/[id]/schedules/[scheduleId]/export
 *
 * Handles exporting schedules in various formats: PDF, CSV, Excel, iCal
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { createEvents, EventAttributes } from "ics";
import { format, differenceInDays } from "date-fns";

const prisma = new PrismaClient();

type ExportFormat = "pdf" | "csv" | "excel" | "ical";

interface ExportRequest {
  format: ExportFormat;
  options?: {
    includeBaseline?: boolean;
    showCriticalPath?: boolean;
    dateRange?: {
      start: string;
      end: string;
    };
    orientation?: "landscape" | "portrait";
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: projectId, scheduleId } = await context.params;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Verify schedule access
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        projectId: project.id,
      },
      include: {
        tasks: {
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Parse request body
    const body: ExportRequest = await request.json();
    const { format, options = {} } = body;

    // Create user map for assignee names
    const userMap = new Map<string, string>();
    project.members.forEach((member) => {
      userMap.set(member.userId, member.user.name || member.user.email);
    });

    // Create task map for dependency names
    const taskMap = new Map<string, any>();
    schedule.tasks.forEach((task) => {
      taskMap.set(task.id, task);
    });

    // Prepare tasks with computed fields
    const exportTasks = schedule.tasks.map((task) => {
      const duration = differenceInDays(
        new Date(task.endDate),
        new Date(task.startDate)
      );
      const progress = task.completed ? 100 : 0;

      const assigneeNames = task.assignees
        .map((id) => userMap.get(id))
        .filter((name): name is string => !!name);

      const dependencyNames = task.dependencies
        .map((id) => taskMap.get(id)?.name)
        .filter((name): name is string => !!name);

      return {
        ...task,
        duration,
        progress,
        assigneeNames,
        dependencyNames,
      };
    });

    // Generate export based on format
    let fileContent: Buffer | string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case "csv":
        ({ content: fileContent, filename, contentType } = generateCSV(
          exportTasks,
          schedule.name
        ));
        break;

      case "excel":
        ({ content: fileContent, filename, contentType } = generateExcel(
          exportTasks,
          schedule.name,
          project.name
        ));
        break;

      case "ical":
        ({ content: fileContent, filename, contentType } = generateICal(
          exportTasks,
          schedule.name,
          project.name
        ));
        break;

      case "pdf":
        // PDF export requires client-side rendering of Gantt chart
        // Return error with instructions
        return NextResponse.json(
          {
            error: "PDF export must be done client-side",
            message:
              "Please use the client-side PDF export function to capture the Gantt chart",
          },
          { status: 400 }
        );

      default:
        return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    // Return file as downloadable response
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    return new NextResponse(fileContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export schedule" },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV export
 */
function generateCSV(
  tasks: any[],
  scheduleName: string
): { content: string; filename: string; contentType: string } {
  const csvData = tasks.map((task) => ({
    "Task Name": task.name,
    Phase: task.phase || "N/A",
    "Start Date": format(new Date(task.startDate), "yyyy-MM-dd"),
    "End Date": format(new Date(task.endDate), "yyyy-MM-dd"),
    "Duration (days)": task.duration,
    Assignees: task.assigneeNames?.join(", ") || "",
    "Progress (%)": task.progress,
    Tags: task.tags.join(", "),
    Dependencies: task.dependencyNames?.join(", ") || "",
    Notes: task.notes || "",
    Color: task.color || "",
    Completed: task.completed ? "Yes" : "No",
  }));

  const csv = Papa.unparse(csvData);

  return {
    content: csv,
    filename: `${scheduleName}-tasks.csv`,
    contentType: "text/csv",
  };
}

/**
 * Generate Excel export
 */
function generateExcel(
  tasks: any[],
  scheduleName: string,
  projectName: string
): { content: Buffer; filename: string; contentType: string } {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Task List
  const taskData = tasks.map((task) => ({
    "Task Name": task.name,
    Phase: task.phase || "N/A",
    "Start Date": format(new Date(task.startDate), "MM/dd/yyyy"),
    "End Date": format(new Date(task.endDate), "MM/dd/yyyy"),
    "Duration (days)": task.duration,
    Assignees: task.assigneeNames?.join(", ") || "",
    "Progress (%)": task.progress / 100,
    Tags: task.tags.join(", "),
    Notes: task.notes || "",
    Completed: task.completed ? "Yes" : "No",
  }));

  const ws1 = XLSX.utils.json_to_sheet(taskData);

  // Format progress column as percentage
  const range = XLSX.utils.decode_range(ws1["!ref"] || "A1");
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 6 }); // Progress column
    if (ws1[cellAddress]) {
      ws1[cellAddress].z = "0%";
    }
  }

  XLSX.utils.book_append_sheet(workbook, ws1, "Tasks");

  // Sheet 2: Phase Summary
  const phaseSummary = groupTasksByPhase(tasks);
  const ws2 = XLSX.utils.json_to_sheet(phaseSummary);
  XLSX.utils.book_append_sheet(workbook, ws2, "By Phase");

  // Sheet 3: Assignee Workload
  const assigneeWorkload = groupTasksByAssignee(tasks);
  const ws3 = XLSX.utils.json_to_sheet(assigneeWorkload);
  XLSX.utils.book_append_sheet(workbook, ws3, "By Assignee");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return {
    content: Buffer.from(buffer),
    filename: `${scheduleName}-schedule.xlsx`,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

/**
 * Generate iCal export
 */
function generateICal(
  tasks: any[],
  scheduleName: string,
  projectName: string
): { content: string; filename: string; contentType: string } {
  const events: EventAttributes[] = tasks.map((task) => {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);

    return {
      title: task.name,
      description: `Project: ${projectName}\nSchedule: ${scheduleName}\nPhase: ${task.phase || "N/A"}\nProgress: ${task.progress}%\n\nNotes: ${task.notes || ""}`,
      start: dateToArray(startDate),
      end: dateToArray(endDate),
      status: task.completed ? "CONFIRMED" : "TENTATIVE",
      busyStatus: "BUSY",
      organizer: { name: "BuildLight", email: "noreply@buildlight.io" },
      categories: task.tags,
    };
  });

  const { error, value } = createEvents(events);

  if (error || !value) {
    throw new Error("Failed to generate iCal file");
  }

  return {
    content: value,
    filename: `${scheduleName}-schedule.ics`,
    contentType: "text/calendar",
  };
}

/**
 * Helper: Convert Date to array format for ics library
 */
function dateToArray(date: Date): [number, number, number, number, number] {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
}

/**
 * Helper: Group tasks by phase
 */
function groupTasksByPhase(tasks: any[]): any[] {
  const phaseMap = new Map<string, any[]>();

  tasks.forEach((task) => {
    const phase = task.phase || "UNASSIGNED";
    if (!phaseMap.has(phase)) {
      phaseMap.set(phase, []);
    }
    phaseMap.get(phase)!.push(task);
  });

  const summary: any[] = [];
  phaseMap.forEach((phaseTasks, phase) => {
    const totalDuration = phaseTasks.reduce(
      (sum, task) => sum + task.duration,
      0
    );
    const avgProgress =
      phaseTasks.reduce((sum, task) => sum + task.progress, 0) /
      phaseTasks.length;

    summary.push({
      Phase: phase,
      "Task Count": phaseTasks.length,
      "Total Duration (days)": totalDuration,
      "Average Progress (%)": Math.round(avgProgress),
      "Completed Tasks": phaseTasks.filter((t) => t.completed).length,
    });
  });

  return summary;
}

/**
 * Helper: Group tasks by assignee
 */
function groupTasksByAssignee(tasks: any[]): any[] {
  const assigneeMap = new Map<string, any[]>();

  tasks.forEach((task) => {
    if (task.assigneeNames && task.assigneeNames.length > 0) {
      task.assigneeNames.forEach((assignee: string) => {
        if (!assigneeMap.has(assignee)) {
          assigneeMap.set(assignee, []);
        }
        assigneeMap.get(assignee)!.push(task);
      });
    } else {
      if (!assigneeMap.has("Unassigned")) {
        assigneeMap.set("Unassigned", []);
      }
      assigneeMap.get("Unassigned")!.push(task);
    }
  });

  const workload: any[] = [];
  assigneeMap.forEach((assigneeTasks, assignee) => {
    const totalDuration = assigneeTasks.reduce(
      (sum, task) => sum + task.duration,
      0
    );
    const avgProgress =
      assigneeTasks.reduce((sum, task) => sum + task.progress, 0) /
      assigneeTasks.length;

    workload.push({
      Assignee: assignee,
      "Task Count": assigneeTasks.length,
      "Total Duration (days)": totalDuration,
      "Average Progress (%)": Math.round(avgProgress),
      "Completed Tasks": assigneeTasks.filter((t) => t.completed).length,
    });
  });

  return workload;
}
