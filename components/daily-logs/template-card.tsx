'use client';

import { LogTemplate } from '@/lib/daily-logs/templates';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: LogTemplate;
  selected?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  isCustom?: boolean;
}

export function TemplateCard({
  template,
  selected = false,
  onClick,
  onDelete,
  isCustom = false,
}: TemplateCardProps) {
  const previewText = template.activities.substring(0, 50) + (template.activities.length > 50 ? '...' : '');

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select ${template.name} template`}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'relative flex flex-col items-center justify-start p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-buildlight-green focus:ring-offset-2',
        selected
          ? 'border-buildlight-green bg-buildlight-green/5 shadow-md'
          : 'border-gray-200 hover:border-buildlight-green/50 bg-white'
      )}
    >
      {/* Delete button for custom templates */}
      {isCustom && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete custom template"
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Icon */}
      <div className="text-5xl mb-3" aria-hidden="true">
        {template.icon}
      </div>

      {/* Template name */}
      <h3 className="font-semibold text-center text-gray-900 mb-2">
        {template.name}
      </h3>

      {/* Preview text */}
      <p className="text-xs text-gray-500 text-center line-clamp-2">
        {previewText}
      </p>

      {/* Custom badge */}
      {isCustom && (
        <span className="mt-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          Custom
        </span>
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-2 left-2">
          <svg
            className="w-5 h-5 text-buildlight-green"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
