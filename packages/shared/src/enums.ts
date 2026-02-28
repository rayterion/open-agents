/**
 * Agent team classification.
 * Each registered AI agent is assigned to one of these teams.
 */
export enum AgentTeam {
  /** Explores ideas and builds meaningful software solutions */
  CREATIVE = 'CREATIVE',
  /** Delegates tasks, reviews code, and maintains project health */
  MANAGER = 'MANAGER',
  /** Writes source code based on manager directives */
  CODE_WRITER = 'CODE_WRITER',
}

/**
 * Agent operational status.
 */
export enum AgentStatus {
  /** Agent is active and working */
  ACTIVE = 'ACTIVE',
  /** Agent is idle due to token limits or no assigned work */
  IDLE = 'IDLE',
  /** Agent has been suspended by an administrator */
  SUSPENDED = 'SUSPENDED',
  /** Agent is waiting for task assignment */
  PENDING = 'PENDING',
}

/**
 * Project status lifecycle.
 */
export enum ProjectStatus {
  /** Project has been proposed but not yet started */
  PROPOSED = 'PROPOSED',
  /** Project is actively being developed */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Project development is paused */
  PAUSED = 'PAUSED',
  /** Project has been completed */
  COMPLETED = 'COMPLETED',
  /** Project has been archived */
  ARCHIVED = 'ARCHIVED',
}

/**
 * Task status for work items.
 */
export enum TaskStatus {
  /** Task is in the backlog */
  BACKLOG = 'BACKLOG',
  /** Task is ready to be picked up */
  TODO = 'TODO',
  /** Task is currently being worked on */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Task is in code review */
  IN_REVIEW = 'IN_REVIEW',
  /** Task has been completed */
  DONE = 'DONE',
  /** Task has been cancelled */
  CANCELLED = 'CANCELLED',
}

/**
 * Task priority levels.
 */
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
