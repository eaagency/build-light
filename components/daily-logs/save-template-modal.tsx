'use client';

import { useState } from 'react';
import { saveCustomTemplate } from '@/lib/daily-logs/templates';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentData: {
    activities: string;
    crewNotes?: string;
    assignedTo?: string;
  };
}

const EMOJI_OPTIONS = [
  '📋', '✅', '🌧️', '☀️', '🔍', '🏗️', '🚚', '⚠️',
  '🔧', '📦', '👷', '🏠', '🔨', '🎯', '📝', '💡',
  '🔥', '❄️', '⛈️', '🌤️', '🌪️', '🏃', '⏸️', '🛑',
];

export function SaveTemplateModal({
  isOpen,
  onClose,
  onSaved,
  currentData,
}: SaveTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📋');
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeCrewNotes, setIncludeCrewNotes] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');

    if (!templateName.trim()) {
      setError('Please enter a template name');
      return;
    }

    if (!includeActivities && !includeCrewNotes) {
      setError('Please include at least activities or crew notes');
      return;
    }

    setSaving(true);

    try {
      saveCustomTemplate({
        name: templateName.trim(),
        icon: selectedIcon,
        activities: includeActivities ? currentData.activities : '',
        crewNotes: includeCrewNotes ? currentData.crewNotes : undefined,
      });

      onSaved();
      handleClose();
    } catch (err) {
      setError('Failed to save template. Please try again.');
      console.error('Error saving template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTemplateName('');
    setSelectedIcon('📋');
    setIncludeActivities(true);
    setIncludeCrewNotes(true);
    setError('');
    onClose();
  };

  const previewText = [
    includeActivities && currentData.activities ? `Activities: ${currentData.activities.substring(0, 50)}...` : null,
    includeCrewNotes && currentData.crewNotes ? `Crew Notes: ${currentData.crewNotes.substring(0, 50)}...` : null,
  ].filter(Boolean).join('\n\n');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="save-template-title" className="text-xl font-bold text-gray-900">
            Save as Template
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-buildlight-green"
          >
            <svg
              className="w-6 h-6 text-gray-500"
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
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template name */}
          <div>
            <label
              htmlFor="template-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Template Name *
            </label>
            <input
              id="template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Morning Briefing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-buildlight-green focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedIcon(emoji)}
                  aria-label={`Select ${emoji} icon`}
                  aria-pressed={selectedIcon === emoji}
                  className={`p-2 text-2xl rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-buildlight-green ${
                    selectedIcon === emoji
                      ? 'border-buildlight-green bg-buildlight-green/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Include options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include in Template
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeActivities}
                  onChange={(e) => setIncludeActivities(e.target.checked)}
                  className="w-4 h-4 text-buildlight-green border-gray-300 rounded focus:ring-buildlight-green"
                />
                <span className="text-sm text-gray-700">Activities</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCrewNotes}
                  onChange={(e) => setIncludeCrewNotes(e.target.checked)}
                  disabled={!currentData.crewNotes}
                  className="w-4 h-4 text-buildlight-green border-gray-300 rounded focus:ring-buildlight-green disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">
                  Crew Notes
                  {!currentData.crewNotes && (
                    <span className="text-gray-400 ml-1">(none entered)</span>
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {previewText && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{selectedIcon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 mb-2">
                      {templateName || 'Untitled Template'}
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {previewText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-buildlight-green text-white font-medium rounded-lg hover:bg-buildlight-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-buildlight-green focus:ring-offset-2"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
