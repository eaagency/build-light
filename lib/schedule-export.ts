/**
 * Schedule Export Utilities
 * Handles exporting schedules in various formats: PDF, CSV, Excel, iCal
 */

import { Task, TaskPhase } from "@prisma/client";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { createEvents, EventAttributes } from "ics";
import { format, differenceInDays } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Export options interface
 */
export interface ExportOptions {
  includeBaseline?: boolean;
  showCriticalPath?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  orientation?: "landscape" | "portrait";
}

/**
 * Enhanced task data for export (includes computed fields)
 */
export interface ExportTask extends Task {
  duration?: number;
  progress?: number;
  assigneeNames?: string[];
  dependencyNames?: string[];
}

/**
 * Export to PDF (Gantt chart)
 * Captures the Gantt chart element and converts it to PDF
 */
export async function exportToPDF(
  ganttElementId: string,
  scheduleName: string,
  projectName: string,
  options: ExportOptions = {}
): Promise<void> {
  const ganttElement = document.getElementById(ganttElementId);

  if (!ganttElement) {
    throw new Error("Gantt chart element not found");
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(ganttElement, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Create PDF
    const orientation = options.orientation || "landscape";
    const pdf = new jsPDF(orientation, "mm", "a4");

    // Calculate dimensions
    const imgWidth = orientation === "landscape" ? 280 : 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add header
    pdf.setFontSize(16);
    pdf.text(`${projectName} - ${scheduleName}`, 10, 10);

    // Add Gantt chart image
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 10, 20, imgWidth, imgHeight);

    // Add footer
    pdf.setFontSize(8);
    const date = format(new Date(), "MMM dd, yyyy HH:mm");
    pdf.text(`Generated: ${date} | BuildLight.io`, 10, pdf.internal.pageSize.height - 10);

    // Download
    pdf.save(`${scheduleName}-gantt.pdf`);
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error("Failed to generate PDF");
  }
}

/**
 * Export to CSV (task list)
 * Generates a CSV file with all task data
 */
export function exportToCSV(
  tasks: ExportTask[],
  scheduleName: string,
  options: ExportOptions = {}
): void {
  // Filter tasks by date range if specified
  let filteredTasks = tasks;
  if (options.dateRange) {
    filteredTasks = tasks.filter((task) => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      return (
        taskStart >= options.dateRange!.start &&
        taskEnd <= options.dateRange!.end
      );
    });
  }

  // Map tasks to CSV rows
  const csvData = filteredTasks.map((task) => ({
    "Task Name": task.name,
    "Phase": task.phase || "N/A",
    "Start Date": format(new Date(task.startDate), "yyyy-MM-dd"),
    "End Date": format(new Date(task.endDate), "yyyy-MM-dd"),
    "Duration (days)": task.duration || differenceInDays(new Date(task.endDate), new Date(task.startDate)),
    "Assignees": task.assigneeNames?.join(", ") || "",
    "Progress (%)": task.progress || (task.completed ? 100 : 0),
    "Tags": task.tags.join(", "),
    "Dependencies": task.dependencyNames?.join(", ") || "",
    "Notes": task.notes || "",
    "Color": task.color || "",
    "Completed": task.completed ? "Yes" : "No",
  }));

  // Generate CSV
  const csv = Papa.unparse(csvData);

  // Download
  downloadFile(csv, `${scheduleName}-tasks.csv`, "text/csv");
}

/**
 * Export to Excel (detailed workbook)
 * Creates a multi-sheet Excel workbook with formatted data
 */
export function exportToExcel(
  tasks: ExportTask[],
  scheduleName: string,
  projectName: string,
  options: ExportOptions = {}
): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Task List
  const taskData = tasks.map((task) => ({
    "Task Name": task.name,
    "Phase": task.phase || "N/A",
    "Start Date": format(new Date(task.startDate), "MM/dd/yyyy"),
    "End Date": format(new Date(task.endDate), "MM/dd/yyyy"),
    "Duration (days)": task.duration || differenceInDays(new Date(task.endDate), new Date(task.startDate)),
    "Assignees": task.assigneeNames?.join(", ") || "",
    "Progress (%)": (task.progress || (task.completed ? 100 : 0)) / 100,
    "Tags": task.tags.join(", "),
    "Notes": task.notes || "",
    "Completed": task.completed ? "Yes" : "No",
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

  // Export
  XLSX.writeFile(workbook, `${scheduleName}-schedule.xlsx`);
}

/**
 * Export to iCal (calendar format)
 * Generates an .ics file for importing into Google Calendar, Outlook, etc.
 */
export function exportToICal(
  tasks: ExportTask[],
  scheduleName: string,
  projectName: string
): void {
  // Convert tasks to calendar events
  const events: EventAttributes[] = tasks.map((task) => {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);

    return {
      title: task.name,
      description: `Project: ${projectName}\nSchedule: ${scheduleName}\nPhase: ${task.phase || "N/A"}\nProgress: ${task.progress || (task.completed ? 100 : 0)}%\n\nNotes: ${task.notes || ""}`,
      start: dateToArray(startDate),
      end: dateToArray(endDate),
      status: task.completed ? "CONFIRMED" : "TENTATIVE",
      busyStatus: "BUSY",
      organizer: { name: "BuildLight", email: "noreply@buildlight.io" },
      categories: task.tags,
      // Note: assignees would need email addresses to be properly added
    };
  });

  // Create events
  const { error, value } = createEvents(events);

  if (error) {
    console.error("iCal export error:", error);
    throw new Error("Failed to generate iCal file");
  }

  if (!value) {
    throw new Error("No iCal data generated");
  }

  // Download
  downloadFile(value, `${scheduleName}-schedule.ics`, "text/calendar");
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
function groupTasksByPhase(tasks: ExportTask[]): any[] {
  const phaseMap = new Map<string, ExportTask[]>();

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
      (sum, task) =>
        sum + (task.duration || differenceInDays(new Date(task.endDate), new Date(task.startDate))),
      0
    );
    const avgProgress =
      phaseTasks.reduce(
        (sum, task) => sum + (task.progress || (task.completed ? 100 : 0)),
        0
      ) / phaseTasks.length;

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
function groupTasksByAssignee(tasks: ExportTask[]): any[] {
  const assigneeMap = new Map<string, ExportTask[]>();

  tasks.forEach((task) => {
    if (task.assigneeNames && task.assigneeNames.length > 0) {
      task.assigneeNames.forEach((assignee) => {
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
      (sum, task) =>
        sum + (task.duration || differenceInDays(new Date(task.endDate), new Date(task.startDate))),
      0
    );
    const avgProgress =
      assigneeTasks.reduce(
        (sum, task) => sum + (task.progress || (task.completed ? 100 : 0)),
        0
      ) / assigneeTasks.length;

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

/**
 * Helper: Download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Calculate task duration in workdays
 */
export function calculateTaskDuration(
  startDate: Date,
  endDate: Date,
  excludeWeekends: boolean = false
): number {
  if (!excludeWeekends) {
    return differenceInDays(endDate, startDate);
  }

  let workdays = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday or Saturday
      workdays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workdays;
}

/**
 * Prepare tasks for export by adding computed fields
 */
export function prepareTasksForExport(
  tasks: Task[],
  userMap: Map<string, string>,
  taskMap: Map<string, Task>
): ExportTask[] {
  return tasks.map((task) => {
    const duration = differenceInDays(new Date(task.endDate), new Date(task.startDate));
    const progress = task.completed ? 100 : 0; // Can be enhanced with actual progress tracking

    // Map assignee IDs to names
    const assigneeNames = task.assignees
      .map((id) => userMap.get(id))
      .filter((name): name is string => !!name);

    // Map dependency IDs to task names
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
}
