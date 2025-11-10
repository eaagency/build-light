"use client";

interface EmptyStateProps {
  /**
   * Type of empty state to display
   */
  type: "no-logs" | "no-results";
  /**
   * Action button text
   */
  actionText?: string;
  /**
   * Action button click handler
   */
  onAction?: () => void;
  /**
   * Optional custom message
   */
  message?: string;
}

export function EmptyState({
  type,
  actionText,
  onAction,
  message,
}: EmptyStateProps) {
  const config = {
    "no-logs": {
      icon: "📋",
      title: "No daily logs yet",
      description:
        message ||
        "Create your first log to document work progress, photos, and site conditions.",
      actionText: actionText || "Create Daily Log",
    },
    "no-results": {
      icon: "🔍",
      title: "No daily logs found",
      description:
        message ||
        "No logs match your current filters. Try adjusting your search or date range.",
      actionText: actionText || "Clear Filters",
    },
  };

  const { icon, title, description, actionText: defaultActionText } =
    config[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-[#6BF178] text-black font-medium rounded-lg hover:bg-[#5DE168] transition-colors"
        >
          {actionText || defaultActionText}
        </button>
      )}
    </div>
  );
}
