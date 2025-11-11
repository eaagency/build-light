export interface LogTemplate {
  id: string;
  name: string;
  icon: string;
  activities: string;
  crewNotes?: string;
  tags?: string[];
}

export const DEFAULT_TEMPLATES: LogTemplate[] = [
  {
    id: 'normal-progress',
    name: 'Normal Progress',
    icon: '✅',
    activities: 'Work proceeded as scheduled. All tasks completed per plan with no issues or delays.',
    crewNotes: 'Crew worked full day. All equipment functioning properly.',
  },
  {
    id: 'weather-delay',
    name: 'Weather Delay',
    icon: '🌧️',
    activities: 'Work halted due to weather conditions. Site secured and materials protected.',
    crewNotes: 'Crew sent home early due to weather. No work completed today.',
  },
  {
    id: 'inspection',
    name: 'Inspection Day',
    icon: '🔍',
    activities: 'Inspection completed today. Inspector reviewed work and provided feedback.',
    crewNotes: 'Crew available for inspector questions. Work paused during inspection.',
    tags: ['Inspection'],
  },
  {
    id: 'concrete-curing',
    name: 'Concrete Curing',
    icon: '🏗️',
    activities: 'Concrete poured yesterday, curing in progress. No active work on site today.',
    crewNotes: 'Site monitored for proper curing. Moisture maintained per spec.',
  },
  {
    id: 'material-delivery',
    name: 'Material Delivery',
    icon: '🚚',
    activities: 'Materials delivered and staged on site. Inventory checked and stored properly.',
    crewNotes: 'Delivery arrived on time. All materials accounted for and undamaged.',
    tags: ['Delivery'],
  },
  {
    id: 'equipment-issue',
    name: 'Equipment Issue',
    icon: '⚠️',
    activities: 'Equipment malfunction caused delay. Work adjusted to focus on tasks not requiring affected equipment.',
    crewNotes: 'Equipment repair scheduled. Alternative work assigned to crew.',
  },
];

// Custom templates are stored in localStorage per user
const CUSTOM_TEMPLATES_KEY = 'buildlight-daily-log-custom-templates';

export function getCustomTemplates(): LogTemplate[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom templates:', error);
    return [];
  }
}

export function saveCustomTemplate(template: Omit<LogTemplate, 'id'>): LogTemplate {
  const customTemplates = getCustomTemplates();
  const newTemplate: LogTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
  };

  customTemplates.push(newTemplate);

  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
  } catch (error) {
    console.error('Error saving custom template:', error);
    throw error;
  }

  return newTemplate;
}

export function deleteCustomTemplate(id: string): void {
  const customTemplates = getCustomTemplates();
  const filtered = customTemplates.filter(t => t.id !== id);

  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting custom template:', error);
    throw error;
  }
}

export function getAllTemplates(): LogTemplate[] {
  return [...DEFAULT_TEMPLATES, ...getCustomTemplates()];
}
