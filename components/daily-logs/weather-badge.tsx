"use client";

import { Weather } from "@prisma/client";
import { WEATHER_OPTIONS } from "@/lib/daily-logs/weather";

interface WeatherBadgeProps {
  /**
   * Weather condition
   */
  weather: Weather;
  /**
   * Show label text (default: true)
   */
  showLabel?: boolean;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

const WEATHER_COLORS: Record<
  Weather,
  { bg: string; text: string; border: string }
> = {
  [Weather.SUNNY]: {
    bg: "bg-yellow-100",
    text: "text-yellow-900",
    border: "border-yellow-200",
  },
  [Weather.CLOUDY]: {
    bg: "bg-gray-100",
    text: "text-gray-900",
    border: "border-gray-200",
  },
  [Weather.RAINY]: {
    bg: "bg-blue-100",
    text: "text-blue-900",
    border: "border-blue-200",
  },
  [Weather.SNOWY]: {
    bg: "bg-cyan-100",
    text: "text-cyan-900",
    border: "border-cyan-200",
  },
  [Weather.WINDY]: {
    bg: "bg-gray-200",
    text: "text-gray-900",
    border: "border-gray-300",
  },
  [Weather.HOT]: {
    bg: "bg-orange-100",
    text: "text-orange-900",
    border: "border-orange-200",
  },
};

const SIZE_CLASSES = {
  sm: {
    container: "px-2 py-0.5 text-xs",
    icon: "text-sm",
  },
  md: {
    container: "px-3 py-1 text-sm",
    icon: "text-base",
  },
  lg: {
    container: "px-4 py-2 text-base",
    icon: "text-lg",
  },
};

export function WeatherBadge({
  weather,
  showLabel = true,
  size = "md",
}: WeatherBadgeProps) {
  const weatherOption = WEATHER_OPTIONS.find((w) => w.value === weather);
  const colors = WEATHER_COLORS[weather];
  const sizeClasses = SIZE_CLASSES[size];

  if (!weatherOption) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses.container} font-medium`}
    >
      <span className={sizeClasses.icon}>{weatherOption.icon}</span>
      {showLabel && <span>{weatherOption.label.replace(/\s.*/, "")}</span>}
    </span>
  );
}
