/**
 * Agent card component for the agents listing screen.
 * Displays agent name, team, status, and reputation.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Agent, AgentTeam, AgentStatus } from '@open-agents/shared';
import { colors, Colors, spacing, fontSize, borderRadius } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface AgentCardProps {
  agent: Agent;
  onPress?: (agent: Agent) => void;
}

const TEAM_COLORS: Record<AgentTeam, string> = {
  [AgentTeam.CREATIVE]: colors.teamCreative,
  [AgentTeam.MANAGER]: colors.teamManager,
  [AgentTeam.CODE_WRITER]: colors.teamCodeWriter,
};

const TEAM_ICONS: Record<AgentTeam, React.ComponentProps<typeof Feather>['name']> = {
  [AgentTeam.CREATIVE]: 'pen-tool',
  [AgentTeam.MANAGER]: 'clipboard',
  [AgentTeam.CODE_WRITER]: 'code',
};

const TEAM_LABELS: Record<AgentTeam, string> = {
  [AgentTeam.CREATIVE]: 'Creative',
  [AgentTeam.MANAGER]: 'Manager',
  [AgentTeam.CODE_WRITER]: 'Code Writer',
};

const STATUS_COLORS: Record<AgentStatus, string> = {
  [AgentStatus.ACTIVE]: colors.statusActive,
  [AgentStatus.IDLE]: colors.statusIdle,
  [AgentStatus.PENDING]: colors.statusPending,
  [AgentStatus.SUSPENDED]: colors.statusSuspended,
};

export function AgentCard({ agent, onPress }: AgentCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const teamColor = TEAM_COLORS[agent.team] ?? colors.textMuted;
  const teamIcon = TEAM_ICONS[agent.team] ?? 'help-circle';
  const statusColor = STATUS_COLORS[agent.status] ?? colors.textMuted;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: teamColor }]}
      onPress={() => onPress?.(agent)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Agent: ${agent.name}`}
    >
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {agent.name}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <View style={styles.teamRow}>
          <Feather name={teamIcon} size={14} color={teamColor} />
          <Text style={[styles.team, { color: teamColor }]}>{TEAM_LABELS[agent.team]}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {agent.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.capabilities}>
          {agent.capabilities.slice(0, 3).map((cap) => (
            <View key={cap} style={styles.capBadge}>
              <Text style={styles.capText}>{cap}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reputation}>
          <Feather name="award" size={14} color={colors.primary} />
          <Text style={styles.repValue}>{agent.reputation}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
  },
  header: {
    marginBottom: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  team: {
    fontSize: fontSize.sm,
    fontWeight: '500',
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
  capabilities: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
  },
  capBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  capText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  reputation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  repValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  });
}
