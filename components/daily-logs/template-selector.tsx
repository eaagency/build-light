'use client';

import { useState, useEffect } from 'react';
import { TemplateCard } from './template-card';
import {
  LogTemplate,
  DEFAULT_TEMPLATES,
  getAllTemplates,
  deleteCustomTemplate,
} from '@/lib/daily-logs/templates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: LogTemplate | null) => void;
  selectedTemplateId?: string | null;
}

export function TemplateSelector({
  onSelectTemplate,
  selectedTemplateId,
}: TemplateSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [templates, setTemplates] = useState<LogTemplate[]>([]);

  useEffect(() => {
    // Load all templates on mount
    setTemplates(getAllTemplates());
  }, []);

  const handleSelectTemplate = (template: LogTemplate) => {
    onSelectTemplate(template);
    // Auto-collapse after selection
    setTimeout(() => setIsExpanded(false), 300);
  };

  const handleSelectCustom = () => {
    onSelectTemplate(null);
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this custom template?')) {
      deleteCustomTemplate(templateId);
      setTemplates(getAllTemplates());

      // If the deleted template was selected, clear selection
      if (selectedTemplateId === templateId) {
        onSelectTemplate(null);
      }
    }
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="template-selector-content"
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-buildlight-green"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-buildlight-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span className="font-semibold text-gray-900">
            Start with a template
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Template grid */}
      {isExpanded && (
        <div
          id="template-selector-content"
          className="p-4 border-t border-gray-200 bg-gray-50"
        >
          {/* Custom option */}
          <div className="mb-4">
            <div
              role="button"
              tabIndex={0}
              aria-label="Start with blank form"
              onClick={handleSelectCustom}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectCustom();
                }
              }}
              className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-buildlight-green cursor-pointer transition-colors bg-white focus:outline-none focus:ring-2 focus:ring-buildlight-green focus:ring-offset-2"
            >
              <div className="text-2xl">📝</div>
              <div>
                <div className="font-medium text-gray-900">Custom Entry</div>
                <div className="text-sm text-gray-500">
                  Start with a blank form
                </div>
              </div>
            </div>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedTemplateId === template.id}
                onClick={() => handleSelectTemplate(template)}
                onDelete={
                  template.id.startsWith('custom-')
                    ? () => handleDeleteCustomTemplate(template.id)
                    : undefined
                }
                isCustom={template.id.startsWith('custom-')}
              />
            ))}
          </div>

          {/* Helper text */}
          <p className="mt-4 text-sm text-gray-500 text-center">
            Select a template to pre-fill the form. You can edit any field after
            selection.
          </p>
        </div>
      )}
    </div>
  );
}
