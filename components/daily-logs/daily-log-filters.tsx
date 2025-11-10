"use client";

import { useState, useEffect } from "react";
import { Weather } from "@prisma/client";
import { subDays, subMonths, startOfDay, endOfDay, format } from "date-fns";
import { WEATHER_OPTIONS } from "@/lib/daily-logs/weather";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface DailyLogFiltersState {
  dateRange: "today" | "7days" | "30days" | "3months" | "custom";
  startDate: Date | null;
  endDate: Date | null;
  weather: Weather[];
  createdBy: string[];
  search: string;
}

interface DailyLogFiltersProps {
  /**
   * Current filter state
   */
  filters: DailyLogFiltersState;
  /**
   * Filter change handler
   */
  onFiltersChange: (filters: DailyLogFiltersState) => void;
  /**
   * Team members for creator filter
   */
  teamMembers: TeamMember[];
  /**
   * Is currently loading
   */
  isLoading?: boolean;
}

const DATE_RANGE_OPTIONS = [
  { value: "today" as const, label: "Today" },
  { value: "7days" as const, label: "Last 7 days" },
  { value: "30days" as const, label: "Last 30 days" },
  { value: "3months" as const, label: "Last 3 months" },
  { value: "custom" as const, label: "Custom range" },
];

export function DailyLogFilters({
  filters,
  onFiltersChange,
  teamMembers,
  isLoading = false,
}: DailyLogFiltersProps) {
  const [showCustomDates, setShowCustomDates] = useState(
    filters.dateRange === "custom"
  );
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDateRangeChange = (
    range: DailyLogFiltersState["dateRange"]
  ) => {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = endOfDay(today);

    switch (range) {
      case "today":
        startDate = startOfDay(today);
        break;
      case "7days":
        startDate = startOfDay(subDays(today, 7));
        break;
      case "30days":
        startDate = startOfDay(subDays(today, 30));
        break;
      case "3months":
        startDate = startOfDay(subMonths(today, 3));
        break;
      case "custom":
        startDate = filters.startDate;
        endDate = filters.endDate;
        setShowCustomDates(true);
        break;
    }

    if (range !== "custom") {
      setShowCustomDates(false);
    }

    onFiltersChange({ ...filters, dateRange: range, startDate, endDate });
  };

  const handleWeatherToggle = (weather: Weather) => {
    const newWeather = filters.weather.includes(weather)
      ? filters.weather.filter((w) => w !== weather)
      : [...filters.weather, weather];
    onFiltersChange({ ...filters, weather: newWeather });
  };

  const handleCreatedByToggle = (userId: string) => {
    const newCreatedBy = filters.createdBy.includes(userId)
      ? filters.createdBy.filter((id) => id !== userId)
      : [...filters.createdBy, userId];
    onFiltersChange({ ...filters, createdBy: newCreatedBy });
  };

  const handleClearFilters = () => {
    const clearedFilters: DailyLogFiltersState = {
      dateRange: "7days",
      startDate: startOfDay(subDays(new Date(), 7)),
      endDate: endOfDay(new Date()),
      weather: [],
      createdBy: [],
      search: "",
    };
    setSearchInput("");
    setShowCustomDates(false);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount =
    filters.weather.length +
    filters.createdBy.length +
    (filters.search ? 1 : 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      {/* Top Row: Search and Clear */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search activities and notes..."
            disabled={isLoading}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BF178] focus:border-transparent disabled:opacity-50"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            disabled={isLoading}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
            type="button"
          >
            Clear {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Date Range</label>
        <div className="flex flex-wrap gap-2">
          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDateRangeChange(option.value)}
              disabled={isLoading}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 ${
                filters.dateRange === option.value
                  ? "bg-[#6BF178] text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {showCustomDates && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Start Date
              </label>
              <input
                type="date"
                value={
                  filters.startDate
                    ? format(filters.startDate, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? startOfDay(new Date(e.target.value))
                    : null;
                  onFiltersChange({ ...filters, startDate: date });
                }}
                max={
                  filters.endDate
                    ? format(filters.endDate, "yyyy-MM-dd")
                    : format(new Date(), "yyyy-MM-dd")
                }
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BF178] focus:border-transparent disabled:opacity-50 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                End Date
              </label>
              <input
                type="date"
                value={
                  filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : ""
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? endOfDay(new Date(e.target.value))
                    : null;
                  onFiltersChange({ ...filters, endDate: date });
                }}
                min={
                  filters.startDate
                    ? format(filters.startDate, "yyyy-MM-dd")
                    : undefined
                }
                max={format(new Date(), "yyyy-MM-dd")}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BF178] focus:border-transparent disabled:opacity-50 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Weather Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Weather</label>
        <div className="flex flex-wrap gap-2">
          {WEATHER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleWeatherToggle(option.value)}
              disabled={isLoading}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                filters.weather.includes(option.value)
                  ? "bg-[#6BF178] text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              type="button"
            >
              <span>{option.icon}</span>
              <span>{option.label.replace(/\s.*/, "")}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Created By Filter */}
      {teamMembers.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Created By
          </label>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleCreatedByToggle(member.id)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  filters.createdBy.includes(member.id)
                    ? "bg-[#6BF178] text-black"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                type="button"
              >
                {member.name || member.email}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
