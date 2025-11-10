/**
 * Critical Path Analysis Utilities
 * Calculates critical path, slack time, and earliest/latest start dates for tasks
 */

import { Task } from "@prisma/client";
import { calculateWorkdays } from "./task-utils";

export interface TaskNode {
  id: string;
  name: string;
  duration: number;
  dependencies: string[];
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
}

export interface CriticalPathResult {
  criticalTasks: string[];
  nodes: Map<string, TaskNode>;
  projectDuration: number;
  projectEnd: Date;
}

/**
 * Calculate critical path using Forward Pass and Backward Pass algorithm
 */
export function calculateCriticalPath(tasks: Task[]): CriticalPathResult {
  if (tasks.length === 0) {
    return {
      criticalTasks: [],
      nodes: new Map(),
      projectDuration: 0,
      projectEnd: new Date(),
    };
  }

  // 1. Initialize nodes
  const nodes = new Map<string, TaskNode>();
  const projectStartDate = new Date(
    Math.min(...tasks.map((t) => new Date(t.startDate).getTime()))
  );

  for (const task of tasks) {
    const duration = calculateWorkdays(
      new Date(task.startDate),
      new Date(task.endDate)
    );

    nodes.set(task.id, {
      id: task.id,
      name: task.name,
      duration,
      dependencies: task.dependencies || [],
      earliestStart: 0,
      earliestFinish: 0,
      latestStart: 0,
      latestFinish: 0,
      slack: 0,
      isCritical: false,
    });
  }

  // 2. Forward Pass: Calculate Earliest Start (ES) and Earliest Finish (EF)
  const sortedTasks = topologicalSort(tasks);

  for (const task of sortedTasks) {
    const node = nodes.get(task.id)!;

    if (node.dependencies.length === 0) {
      // No dependencies: starts at project start (day 0)
      node.earliestStart = 0;
    } else {
      // Has dependencies: starts after all dependencies finish
      node.earliestStart = Math.max(
        ...node.dependencies.map((depId) => {
          const dep = nodes.get(depId);
          return dep ? dep.earliestFinish : 0;
        })
      );
    }

    node.earliestFinish = node.earliestStart + node.duration;
  }

  // 3. Find project end (maximum earliest finish)
  const projectDuration = Math.max(
    ...Array.from(nodes.values()).map((n) => n.earliestFinish)
  );

  // 4. Backward Pass: Calculate Latest Start (LS) and Latest Finish (LF)
  for (const task of sortedTasks.reverse()) {
    const node = nodes.get(task.id)!;

    // Find tasks that depend on this task
    const dependents = Array.from(nodes.values()).filter((n) =>
      n.dependencies.includes(task.id)
    );

    if (dependents.length === 0) {
      // No dependents: must finish by project end
      node.latestFinish = projectDuration;
    } else {
      // Has dependents: must finish before earliest dependent starts
      node.latestFinish = Math.min(
        ...dependents.map((dep) => dep.latestStart)
      );
    }

    node.latestStart = node.latestFinish - node.duration;
  }

  // 5. Calculate slack and identify critical tasks
  const criticalTasks: string[] = [];

  for (const node of nodes.values()) {
    node.slack = node.latestStart - node.earliestStart;
    node.isCritical = node.slack === 0;

    if (node.isCritical) {
      criticalTasks.push(node.id);
    }
  }

  // Calculate project end date
  const projectEnd = new Date(projectStartDate);
  projectEnd.setDate(projectEnd.getDate() + projectDuration);

  return {
    criticalTasks,
    nodes,
    projectDuration,
    projectEnd,
  };
}

/**
 * Topological sort for dependency resolution
 * Returns tasks in order where dependencies come before dependents
 */
function topologicalSort(tasks: Task[]): Task[] {
  const visited = new Set<string>();
  const result: Task[] = [];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  function visit(taskId: string) {
    if (visited.has(taskId)) return;

    const task = taskMap.get(taskId);
    if (!task) return;

    visited.add(taskId);

    // Visit dependencies first
    for (const depId of task.dependencies || []) {
      visit(depId);
    }

    result.push(task);
  }

  // Visit all tasks
  for (const task of tasks) {
    visit(task.id);
  }

  return result;
}

/**
 * Calculate slack time for a specific task
 */
export function calculateSlackTime(
  taskId: string,
  nodes: Map<string, TaskNode>
): number {
  const node = nodes.get(taskId);
  return node ? node.slack : 0;
}

/**
 * Get all tasks on critical path
 */
export function getCriticalPathTasks(
  tasks: Task[]
): { taskIds: string[]; pathLength: number } {
  const result = calculateCriticalPath(tasks);
  return {
    taskIds: result.criticalTasks,
    pathLength: result.projectDuration,
  };
}

/**
 * Check if a task is on the critical path
 */
export function isTaskCritical(taskId: string, tasks: Task[]): boolean {
  const result = calculateCriticalPath(tasks);
  return result.criticalTasks.includes(taskId);
}

/**
 * Calculate the impact of delaying a task
 * Returns how many days the project end date would be delayed
 */
export function calculateDelayImpact(
  taskId: string,
  delayDays: number,
  tasks: Task[]
): number {
  const result = calculateCriticalPath(tasks);
  const node = result.nodes.get(taskId);

  if (!node) return 0;

  // If task has slack, delay up to slack amount won't impact project
  if (node.slack >= delayDays) {
    return 0;
  }

  // If task is critical, any delay impacts project
  if (node.isCritical) {
    return delayDays;
  }

  // Delay exceeds slack
  return delayDays - node.slack;
}

/**
 * Get tasks that would become critical if a task is delayed
 */
export function getTasksBecomesCritical(
  taskId: string,
  delayDays: number,
  tasks: Task[]
): string[] {
  const result = calculateCriticalPath(tasks);
  const affectedTasks: string[] = [];

  for (const [id, node] of result.nodes) {
    // Check if this task's slack would be consumed by the delay
    if (!node.isCritical && node.slack <= delayDays) {
      affectedTasks.push(id);
    }
  }

  return affectedTasks;
}

/**
 * Format slack time for display
 */
export function formatSlackTime(days: number): string {
  if (days === 0) return "No slack";
  if (days === 1) return "1 day slack";
  return `${days} days slack`;
}

/**
 * Calculate free float (slack that doesn't affect successor tasks)
 */
export function calculateFreeFloat(
  taskId: string,
  tasks: Task[]
): number {
  const result = calculateCriticalPath(tasks);
  const node = result.nodes.get(taskId);

  if (!node) return 0;

  // Find immediate successors
  const successors = Array.from(result.nodes.values()).filter((n) =>
    n.dependencies.includes(taskId)
  );

  if (successors.length === 0) {
    return node.slack;
  }

  // Free float is the minimum slack before affecting any successor
  const minSuccessorES = Math.min(...successors.map((s) => s.earliestStart));
  return minSuccessorES - node.earliestFinish;
}

/**
 * Get critical path as a chain of task names
 */
export function getCriticalPathChain(tasks: Task[]): string[] {
  const result = calculateCriticalPath(tasks);
  const criticalNodes = Array.from(result.nodes.values()).filter(
    (n) => n.isCritical
  );

  // Sort by earliest start
  criticalNodes.sort((a, b) => a.earliestStart - b.earliestStart);

  return criticalNodes.map((n) => n.name);
}
