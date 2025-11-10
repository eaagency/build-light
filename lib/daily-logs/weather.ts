/**
 * Weather Utility for Daily Logs
 * Provides weather dropdown options and helper functions
 */

import { Weather } from "@prisma/client";

/**
 * Weather dropdown options with icons
 */
export const WEATHER_OPTIONS = [
  { value: Weather.SUNNY, label: "Sunny ☀️", icon: "☀️", description: "Clear skies" },
  { value: Weather.CLOUDY, label: "Cloudy ☁️", icon: "☁️", description: "Overcast" },
  { value: Weather.RAINY, label: "Rainy 🌧️", icon: "🌧️", description: "Precipitation" },
  { value: Weather.SNOWY, label: "Snowy ❄️", icon: "❄️", description: "Snow conditions" },
  { value: Weather.WINDY, label: "Windy 💨", icon: "💨", description: "High winds" },
  { value: Weather.HOT, label: "Hot 🔥", icon: "🔥", description: "Extreme heat" },
] as const;

/**
 * Get weather label with icon
 * @param weather - Weather condition enum value
 * @returns Label with emoji icon (e.g., "Sunny ☀️")
 */
export function getWeatherLabel(weather: Weather): string {
  const option = WEATHER_OPTIONS.find((w) => w.value === weather);
  return option?.label || weather;
}

/**
 * Get weather icon emoji
 * @param weather - Weather condition enum value
 * @returns Emoji icon (e.g., "☀️")
 */
export function getWeatherIcon(weather: Weather): string {
  const option = WEATHER_OPTIONS.find((w) => w.value === weather);
  return option?.icon || "🌤️";
}

/**
 * Get weather description
 * @param weather - Weather condition enum value
 * @returns Short description (e.g., "Clear skies")
 */
export function getWeatherDescription(weather: Weather): string {
  const option = WEATHER_OPTIONS.find((w) => w.value === weather);
  return option?.description || "";
}

/**
 * Check if weather condition requires safety notes
 * Some conditions (SNOWY, HOT, WINDY) may require additional safety precautions
 * @param weather - Weather condition enum value
 * @returns true if condition requires safety consideration
 */
export function requiresSafetyNotes(weather: Weather): boolean {
  return [Weather.SNOWY, Weather.HOT, Weather.WINDY].includes(weather);
}

/**
 * Get safety warning message for weather condition
 * @param weather - Weather condition enum value
 * @returns Safety message or null
 */
export function getSafetyWarning(weather: Weather): string | null {
  switch (weather) {
    case Weather.SNOWY:
      return "Snow conditions may affect work safety. Ensure proper precautions.";
    case Weather.HOT:
      return "Extreme heat detected. Ensure crew stays hydrated and takes breaks.";
    case Weather.WINDY:
      return "High winds may affect certain operations. Exercise caution with elevated work.";
    case Weather.RAINY:
      return "Wet conditions may affect productivity and safety.";
    default:
      return null;
  }
}

/**
 * Weather condition severity rating (for sorting/filtering)
 * Lower = better conditions, Higher = more challenging
 */
export function getWeatherSeverity(weather: Weather): number {
  const severity = {
    [Weather.SUNNY]: 1,
    [Weather.CLOUDY]: 2,
    [Weather.WINDY]: 3,
    [Weather.HOT]: 4,
    [Weather.RAINY]: 5,
    [Weather.SNOWY]: 6,
  };
  return severity[weather] || 0;
}
