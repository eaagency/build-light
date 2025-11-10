"use client";

import { format, isToday, isYesterday } from "date-fns";

interface LogDateMarkerProps {
  /**
   * Date for the marker
   */
  date: Date;
  /**
   * Is this the first marker (no line above)
   */
  isFirst?: boolean;
  /**
   * Is this the last marker (no line below)
   */
  isLast?: boolean;
}

function formatLogDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy"); // "Monday, November 11, 2024"
}

export function LogDateMarker({
  date,
  isFirst = false,
  isLast = false,
}: LogDateMarkerProps) {
  return (
    <div className="flex items-start gap-4">
      {/* Desktop: Date on left side */}
      <div className="hidden md:block w-48 text-right pt-1">
        <time className="text-sm font-medium text-gray-700">
          {formatLogDate(date)}
        </time>
      </div>

      {/* Timeline marker */}
      <div className="relative flex flex-col items-center">
        {/* Line above */}
        {!isFirst && (
          <div className="absolute bottom-full w-0.5 h-8 bg-gray-300" />
        )}

        {/* Circle marker */}
        <div className="w-4 h-4 rounded-full bg-[#6BF178] border-4 border-white ring-2 ring-gray-300 z-10" />

        {/* Line below */}
        {!isLast && <div className="absolute top-full w-0.5 h-full bg-gray-300" />}
      </div>

      {/* Mobile: Date above card */}
      <div className="md:hidden flex-1">
        <time className="text-sm font-medium text-gray-700">
          {formatLogDate(date)}
        </time>
      </div>
    </div>
  );
}
