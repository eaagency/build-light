"use client";

import React, { useState, useEffect } from "react";
import { Weather } from "@prisma/client";
import { DatePickerField } from "./date-picker-field";
import { WeatherSelector } from "./weather-selector";
import { PhotoUploadZone } from "./photo-upload-zone";
import { AssignedToSelector } from "./assigned-to-selector";
import { TemplateSelector } from "./template-selector";
import { SaveTemplateModal } from "./save-template-modal";
import { dailyLogExistsForDate, createDailyLog, getDailyLogsByDateRange } from "@/lib/api/daily-logs";
import { show } from "@/lib/toast";
import { LogTemplate } from "@/lib/daily-logs/templates";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface CreateDailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  teamMembers: TeamMember[];
  currentUserId?: string;
  onSuccess?: () => void;
}

interface FormData {
  date: Date | null;
  weather: Weather | null;
  activities: string;
  crewNotes: string;
  photos: string[];
  assignedToId: string | null;
}

/**
 * CreateDailyLogModal Component
 * Main form for creating daily logs
 *
 * Features:
 * - Auto-save draft to localStorage
 * - Inline validation
 * - Photo compression and upload
 * - Duplicate date detection
 * - Mobile-optimized
 */
export function CreateDailyLogModal({
  isOpen,
  onClose,
  projectId,
  teamMembers,
  currentUserId,
  onSuccess,
}: CreateDailyLogModalProps) {
  const [formData, setFormData] = useState<FormData>({
    date: new Date(),
    weather: null,
    activities: "",
    crewNotes: "",
    photos: [],
    assignedToId: currentUserId || null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCrewNotes, setShowCrewNotes] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isOpen) return;

    const draftKey = `daily-log-draft-${projectId}`;
    const draft = {
      date: formData.date?.toISOString(),
      weather: formData.weather,
      activities: formData.activities,
      crewNotes: formData.crewNotes,
      assignedToId: formData.assignedToId,
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [formData, projectId, isOpen]);

  // Restore draft on mount
  useEffect(() => {
    if (!isOpen) return;

    const draftKey = `daily-log-draft-${projectId}`;
    const saved = localStorage.getItem(draftKey);

    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          date: draft.date ? new Date(draft.date) : new Date(),
          weather: draft.weather,
          activities: draft.activities || "",
          crewNotes: draft.crewNotes || "",
          assignedToId: draft.assignedToId || currentUserId || null,
        }));

        if (draft.crewNotes) {
          setShowCrewNotes(true);
        }

        show("Draft restored", { icon: "📝" });
      } catch (error) {
        console.error("Failed to restore draft:", error);
      }
    }
  }, [isOpen, projectId, currentUserId]);

  // Handle template selection
  const handleSelectTemplate = (template: LogTemplate | null) => {
    if (template) {
      setFormData((prev) => ({
        ...prev,
        activities: template.activities,
        crewNotes: template.crewNotes || "",
      }));

      if (template.crewNotes) {
        setShowCrewNotes(true);
      }

      setSelectedTemplateId(template.id);
      show(`Applied ${template.name} template`, { icon: template.icon });
    } else {
      setSelectedTemplateId(null);
    }
  };

  // Quick action: Set date to yesterday
  const handleSetYesterday = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    setFormData({ ...formData, date: yesterday });

    // Check if log exists for yesterday
    const exists = await checkExistingLog(yesterday);
    if (exists) {
      show("A log already exists for yesterday", { icon: "⚠️" });
    }
  };

  // Quick action: Copy weather from yesterday
  const handleCopyWeatherFromYesterday = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfDay = new Date(yesterday);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59, 999);

      const logs = await getDailyLogsByDateRange(projectId, startOfDay, endOfDay);

      if (logs.length > 0) {
        setFormData({ ...formData, weather: logs[0].weather });
        show("Weather copied from yesterday", { icon: "☀️" });
      } else {
        show("No log found for yesterday", { icon: "⚠️" });
      }
    } catch (error) {
      console.error("Error copying weather:", error);
      show("Failed to copy weather", { icon: "❌" });
    }
  };

  // Quick action: Copy from yesterday
  const handleCopyFromYesterday = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfDay = new Date(yesterday);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59, 999);

      const logs = await getDailyLogsByDateRange(projectId, startOfDay, endOfDay);

      if (logs.length > 0) {
        const yesterdayLog = logs[0];
        setFormData({
          ...formData,
          weather: yesterdayLog.weather,
          activities: yesterdayLog.activities + " (continued)",
          assignedToId: yesterdayLog.assignedToId,
        });
        show("Copied from yesterday", { icon: "📋" });
      } else {
        show("No log found for yesterday", { icon: "⚠️" });
      }
    } catch (error) {
      console.error("Error copying from yesterday:", error);
      show("Failed to copy from yesterday", { icon: "❌" });
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.weather) {
      newErrors.weather = "Weather is required";
    }

    if (!formData.activities || formData.activities.trim().length === 0) {
      newErrors.activities = "Activities are required";
    }

    if (formData.activities.length > 5000) {
      newErrors.activities = "Activities must be 5000 characters or less";
    }

    if (formData.crewNotes.length > 2000) {
      newErrors.crewNotes = "Crew notes must be 2000 characters or less";
    }

    if (!formData.assignedToId) {
      newErrors.assignedToId = "Assigned to is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      show("Please fix form errors", { icon: "❌" });
      return;
    }

    setIsSubmitting(true);

    try {
      await createDailyLog(projectId, {
        date: formData.date!,
        weather: formData.weather!,
        activities: formData.activities,
        crewNotes: formData.crewNotes || undefined,
        photos: formData.photos,
        assignedToId: formData.assignedToId!,
      });

      // Clear draft
      localStorage.removeItem(`daily-log-draft-${projectId}`);

      show("Daily log created successfully", { icon: "✅" });

      // Reset form
      setFormData({
        date: new Date(),
        weather: null,
        activities: "",
        crewNotes: "",
        photos: [],
        assignedToId: currentUserId || null,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Create daily log error:", error);

      if (error.message.includes("already exists")) {
        show("A log already exists for this date", { icon: "⚠️" });
      } else if (error.message.includes("future")) {
        show("Date cannot be in the future", { icon: "⚠️" });
      } else {
        show(error.message || "Failed to create daily log", { icon: "❌" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if log exists for selected date
  const checkExistingLog = async (date: Date): Promise<boolean> => {
    try {
      return await dailyLogExistsForDate(projectId, date);
    } catch (error) {
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-0 md:items-center md:p-4">
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Daily Log
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Template Selector */}
              <TemplateSelector
                onSelectTemplate={handleSelectTemplate}
                selectedTemplateId={selectedTemplateId}
              />

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSetYesterday}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-buildlight-green"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={handleCopyWeatherFromYesterday}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-buildlight-green"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Same weather
                </button>
                <button
                  type="button"
                  onClick={handleCopyFromYesterday}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-buildlight-green"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Copy from yesterday
                </button>
              </div>

              {/* Date */}
              <DatePickerField
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                onDateCheck={checkExistingLog}
                error={errors.date}
                disabled={isSubmitting}
              />

              {/* Weather */}
              <WeatherSelector
                value={formData.weather}
                onChange={(weather) => setFormData({ ...formData, weather })}
                error={errors.weather}
                disabled={isSubmitting}
              />

              {/* Activities */}
              <div className="space-y-2">
                <label htmlFor="activities" className="block text-sm font-medium text-gray-900 dark:text-white">
                  What work was completed today? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="activities"
                  value={formData.activities}
                  onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                  placeholder="Describe the day's progress, completed tasks, and any significant events..."
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#6BF178] focus:border-transparent disabled:opacity-50 resize-none"
                  style={{ fontSize: "16px" }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {formData.activities.length} / 5000
                  </p>
                  {errors.activities && (
                    <p className="text-sm text-red-600">{errors.activities}</p>
                  )}
                </div>
              </div>

              {/* Photos */}
              <PhotoUploadZone
                photos={formData.photos}
                onChange={(photos) => setFormData({ ...formData, photos })}
                projectId={projectId}
                logDate={formData.date || new Date()}
                disabled={isSubmitting}
              />

              {/* Crew Notes (Collapsible) */}
              {!showCrewNotes && (
                <button
                  type="button"
                  onClick={() => setShowCrewNotes(true)}
                  className="text-sm text-[#6BF178] hover:underline"
                >
                  + Add crew notes
                </button>
              )}

              {showCrewNotes && (
                <div className="space-y-2">
                  <label htmlFor="crew-notes" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Crew notes (optional)
                  </label>
                  <textarea
                    id="crew-notes"
                    value={formData.crewNotes}
                    onChange={(e) => setFormData({ ...formData, crewNotes: e.target.value })}
                    placeholder="Notes about crew, equipment, materials, or issues..."
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#6BF178] focus:border-transparent disabled:opacity-50 resize-none"
                    style={{ fontSize: "16px" }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {formData.crewNotes.length} / 2000
                    </p>
                    {errors.crewNotes && (
                      <p className="text-sm text-red-600">{errors.crewNotes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Assigned To */}
              <AssignedToSelector
                value={formData.assignedToId}
                onChange={(userId) => setFormData({ ...formData, assignedToId: userId })}
                teamMembers={teamMembers}
                error={errors.assignedToId}
                disabled={isSubmitting}
              />
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(true)}
                disabled={isSubmitting || !formData.activities}
                className="px-4 py-2 text-sm text-buildlight-green hover:bg-buildlight-green/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-buildlight-green"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save as template
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-[#6BF178] text-gray-900 rounded-lg hover:bg-[#5DE068] disabled:opacity-50 font-medium flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Daily Log"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        onSaved={() => {
          show("Template saved successfully", { icon: "✅" });
        }}
        currentData={{
          activities: formData.activities,
          crewNotes: formData.crewNotes,
          assignedTo: formData.assignedToId || undefined,
        }}
      />
    </>
  );
}
