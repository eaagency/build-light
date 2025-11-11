import { jsPDF } from 'jspdf';
import { DailyLogWithRelations } from '../api/daily-logs';

/**
 * Daily Logs Export Utilities
 * Export daily logs to various formats (CSV, PDF, Excel)
 */

/**
 * Export logs to CSV format
 */
export function exportToCSV(
  logs: DailyLogWithRelations[],
  projectName: string
): void {
  if (logs.length === 0) {
    throw new Error('No logs to export');
  }

  // CSV headers
  const headers = [
    'Date',
    'Weather',
    'Activities',
    'Crew Notes',
    'Assigned To',
    'Created By',
    'Photo Count',
    'Created At',
  ];

  // Convert logs to CSV rows
  const rows = logs.map((log) => [
    new Date(log.date).toLocaleDateString(),
    log.weather,
    `"${log.activities.replace(/"/g, '""')}"`, // Escape quotes
    log.crewNotes ? `"${log.crewNotes.replace(/"/g, '""')}"` : '',
    log.assignedTo.name || log.assignedTo.email,
    log.createdBy.name || log.createdBy.email,
    log.photoCount || 0,
    new Date(log.createdAt).toLocaleString(),
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.join(','))
    .join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}-daily-logs-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export logs to Excel-compatible CSV format
 */
export function exportToExcel(
  logs: DailyLogWithRelations[],
  projectName: string
): void {
  if (logs.length === 0) {
    throw new Error('No logs to export');
  }

  // Excel headers with additional columns
  const headers = [
    'Date',
    'Day of Week',
    'Weather',
    'Activities',
    'Crew Notes',
    'Assigned To',
    'Assigned To Email',
    'Created By',
    'Created By Email',
    'Photo Count',
    'Created At',
    'Updated At',
  ];

  // Convert logs to Excel rows
  const rows = logs.map((log) => {
    const date = new Date(log.date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

    return [
      date.toLocaleDateString(),
      dayOfWeek,
      log.weather,
      `"${log.activities.replace(/"/g, '""')}"`,
      log.crewNotes ? `"${log.crewNotes.replace(/"/g, '""')}"` : '',
      log.assignedTo.name || '',
      log.assignedTo.email,
      log.createdBy.name || '',
      log.createdBy.email,
      log.photoCount || 0,
      new Date(log.createdAt).toLocaleString(),
      new Date(log.updatedAt).toLocaleString(),
    ];
  });

  // Combine with BOM for Excel compatibility
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}-daily-logs-detailed-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Format weather for display
 */
function formatWeather(weather: string): string {
  const weatherMap: Record<string, string> = {
    SUNNY: '☀️ Sunny',
    CLOUDY: '☁️ Cloudy',
    RAINY: '🌧️ Rainy',
    STORMY: '⛈️ Stormy',
    SNOWY: '❄️ Snowy',
    WINDY: '💨 Windy',
  };

  return weatherMap[weather] || weather;
}

/**
 * Export logs to PDF format
 */
export async function exportToPDF(
  logs: DailyLogWithRelations[],
  projectName: string,
  projectAddress?: string
): Promise<void> {
  if (logs.length === 0) {
    throw new Error('No logs to export');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Title page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Logs Report', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName, pageWidth / 2, yPosition, { align: 'center' });

  if (projectAddress) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(projectAddress, pageWidth / 2, yPosition, { align: 'center' });
    doc.setTextColor(0);
  }

  yPosition += 15;
  doc.setFontSize(10);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  yPosition += 10;
  doc.text(
    `Total Logs: ${logs.length}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  // Add logs
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Add new page for each log
    doc.addPage();
    yPosition = margin;

    // Date header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const dateStr = new Date(log.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(dateStr, margin, yPosition);

    yPosition += 12;

    // Weather
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Weather: ${formatWeather(log.weather)}`, margin, yPosition);

    yPosition += 10;

    // Activities
    doc.setFont('helvetica', 'bold');
    doc.text('Activities:', margin, yPosition);

    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const activitiesLines = doc.splitTextToSize(
      log.activities,
      pageWidth - margin * 2
    );

    for (const line of activitiesLines) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // Crew Notes (if any)
    if (log.crewNotes) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Crew Notes:', margin, yPosition);

      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      const notesLines = doc.splitTextToSize(
        log.crewNotes,
        pageWidth - margin * 2
      );

      for (const line of notesLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      }

      yPosition += 5;
    }

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Assigned to: ${log.assignedTo.name || log.assignedTo.email}`,
      margin,
      yPosition
    );

    yPosition += 6;
    doc.text(
      `Created by: ${log.createdBy.name || log.createdBy.email}`,
      margin,
      yPosition
    );

    yPosition += 6;
    if (log.photoCount && log.photoCount > 0) {
      doc.text(`Photos: ${log.photoCount}`, margin, yPosition);
    }

    doc.setTextColor(0);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i + 2} of ${logs.length + 1}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.setTextColor(0);
  }

  // Save PDF
  const filename = `${projectName}-daily-logs-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Get export summary for date range
 */
export function getExportSummary(logs: DailyLogWithRelations[]): {
  totalLogs: number;
  dateRange: string;
  totalPhotos: number;
  weatherBreakdown: Record<string, number>;
} {
  if (logs.length === 0) {
    return {
      totalLogs: 0,
      dateRange: '',
      totalPhotos: 0,
      weatherBreakdown: {},
    };
  }

  // Sort logs by date
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstDate = new Date(sortedLogs[0].date).toLocaleDateString();
  const lastDate = new Date(
    sortedLogs[sortedLogs.length - 1].date
  ).toLocaleDateString();

  const totalPhotos = logs.reduce((sum, log) => sum + (log.photoCount || 0), 0);

  const weatherBreakdown: Record<string, number> = {};
  logs.forEach((log) => {
    weatherBreakdown[log.weather] = (weatherBreakdown[log.weather] || 0) + 1;
  });

  return {
    totalLogs: logs.length,
    dateRange: `${firstDate} - ${lastDate}`,
    totalPhotos,
    weatherBreakdown,
  };
}
