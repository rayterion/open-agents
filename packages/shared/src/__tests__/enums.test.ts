import { AgentTeam, AgentStatus, ProjectStatus, TaskStatus, TaskPriority } from '../enums';

describe('Enums', () => {
  describe('AgentTeam', () => {
    it('should have CREATIVE team', () => {
      expect(AgentTeam.CREATIVE).toBe('CREATIVE');
    });

    it('should have MANAGER team', () => {
      expect(AgentTeam.MANAGER).toBe('MANAGER');
    });

    it('should have CODE_WRITER team', () => {
      expect(AgentTeam.CODE_WRITER).toBe('CODE_WRITER');
    });

    it('should have exactly 3 teams', () => {
      const teams = Object.values(AgentTeam);
      expect(teams).toHaveLength(3);
    });
  });

  describe('AgentStatus', () => {
    it('should have all expected statuses', () => {
      expect(AgentStatus.ACTIVE).toBe('ACTIVE');
      expect(AgentStatus.IDLE).toBe('IDLE');
      expect(AgentStatus.SUSPENDED).toBe('SUSPENDED');
      expect(AgentStatus.PENDING).toBe('PENDING');
    });

    it('should have exactly 4 statuses', () => {
      expect(Object.values(AgentStatus)).toHaveLength(4);
    });
  });

  describe('ProjectStatus', () => {
    it('should have all expected statuses', () => {
      expect(ProjectStatus.PROPOSED).toBe('PROPOSED');
      expect(ProjectStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(ProjectStatus.PAUSED).toBe('PAUSED');
      expect(ProjectStatus.COMPLETED).toBe('COMPLETED');
      expect(ProjectStatus.ARCHIVED).toBe('ARCHIVED');
    });

    it('should have exactly 5 statuses', () => {
      expect(Object.values(ProjectStatus)).toHaveLength(5);
    });
  });

  describe('TaskStatus', () => {
    it('should have all expected statuses', () => {
      expect(TaskStatus.BACKLOG).toBe('BACKLOG');
      expect(TaskStatus.TODO).toBe('TODO');
      expect(TaskStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(TaskStatus.IN_REVIEW).toBe('IN_REVIEW');
      expect(TaskStatus.DONE).toBe('DONE');
      expect(TaskStatus.CANCELLED).toBe('CANCELLED');
    });

    it('should have exactly 6 statuses', () => {
      expect(Object.values(TaskStatus)).toHaveLength(6);
    });
  });

  describe('TaskPriority', () => {
    it('should have all expected priorities', () => {
      expect(TaskPriority.LOW).toBe('LOW');
      expect(TaskPriority.MEDIUM).toBe('MEDIUM');
      expect(TaskPriority.HIGH).toBe('HIGH');
      expect(TaskPriority.CRITICAL).toBe('CRITICAL');
    });

    it('should have exactly 4 priorities', () => {
      expect(Object.values(TaskPriority)).toHaveLength(4);
    });
  });
});
