'use client';

import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface OnboardingTourProps {
  onComplete?: () => void;
}

const TOUR_COMPLETED_KEY = 'buildlight-daily-logs-tour-completed';

/**
 * OnboardingTour Component
 * First-time user tutorial for Daily Logs feature
 *
 * Shows a 3-step tutorial covering:
 * 1. Creating a daily log
 * 2. Uploading photos
 * 3. Viewing timeline
 */
export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Check if tour has been completed
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);

    if (!tourCompleted) {
      // Delay tour start to allow page to render
      setTimeout(() => {
        setRunTour(true);
      }, 1000);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '[data-tour="create-log-button"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Create Your First Daily Log</h3>
          <p className="text-sm text-gray-600">
            Click here to create a new daily log. Document your project progress,
            weather conditions, and site activities.
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="photo-upload"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Upload Photos From the Field</h3>
          <p className="text-sm text-gray-600">
            Add photos to document progress. On mobile, you can take photos
            directly with your camera. Photos are automatically compressed to save
            bandwidth.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="timeline"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">View Timeline of All Logs</h3>
          <p className="text-sm text-gray-600">
            Browse your daily logs in chronological order. Filter by date, weather,
            or search for specific activities. You can edit or delete logs anytime.
          </p>
        </div>
      ),
      placement: 'top',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Mark tour as completed
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      setRunTour(false);
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6BF178', // BuildLight Green
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: '#6BF178',
          color: '#1F2937',
          fontSize: '14px',
          fontWeight: 600,
          padding: '10px 16px',
          borderRadius: '8px',
        },
        buttonBack: {
          color: '#6B7280',
          fontSize: '14px',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#9CA3AF',
          fontSize: '14px',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '16px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 700,
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '14px',
          padding: '8px 0',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Got it!',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  );
}

/**
 * Reset tour completion status (for testing)
 */
export function resetOnboardingTour(): void {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
}

/**
 * Check if tour has been completed
 */
export function hasCompletedOnboarding(): boolean {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
}
