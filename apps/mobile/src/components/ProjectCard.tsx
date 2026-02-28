/**
 * Project card component for the projects listing screen.
 * Displays project name, description, status, and tags.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Project, ProjectStatus } from '@open-agents/shared';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface ProjectCardProps {
  project: Project;
  onPress?: (project: Project) => void;
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.PROPOSED]: colors.info,
  [ProjectStatus.IN_PROGRESS]: colors.primary,
  [ProjectStatus.PAUSED]: colors.warning,
  [ProjectStatus.COMPLETED]: colors.success,
  [ProjectStatus.ARCHIVED]: colors.textMuted,
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PROPOSED]: 'Proposed',
  [ProjectStatus.IN_PROGRESS]: 'In Progress',
  [ProjectStatus.PAUSED]: 'Paused',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.ARCHIVED]: 'Archived',
};

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status] ?? colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(project)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Project: ${project.name}`}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {project.name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[project.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {project.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.tags}>
          {project.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {project.tags.length > 3 && (
            <Text style={styles.moreCount}>+{project.tags.length - 3}</Text>
          )}
        </View>

        <View style={styles.agents}>
          <Text style={styles.agentCount}>
            {project.assignedAgentIds.length} agent
            {project.assignedAgentIds.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  moreCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  agents: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
