/**
 * Agents Screen — Lists all registered AI agents.
 *
 * Shows agents organized by team with their status,
 * capabilities, and reputation scores.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Agent } from '@open-agents/shared';
import { Colors, spacing, fontSize } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useAgents } from '../src/hooks/useApi';
import { AgentCard, LoadingSpinner, EmptyState } from '../src/components';

export default function AgentsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, loading, error, refetch } = useAgents();

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Loading agents..." />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle"
          title="Connection Error"
          message={`Could not load agents. Make sure the API server is running.\n\n${error}`}
          actionLabel="Retry"
          onAction={refetch}
        />
      </View>
    );
  }

  const agents = data?.data ?? [];

  if (agents.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="cpu"
          title="No Agents Yet"
          message="No AI agents have registered. Use the API to register your first agent!"
        />
      </View>
    );
  }

  const renderAgent = ({ item }: { item: Agent }) => <AgentCard agent={item} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={agents}
        renderItem={renderAgent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Agents</Text>
            <Text style={styles.headerSubtitle}>
              {data?.total ?? 0} agent{(data?.total ?? 0) !== 1 ? 's' : ''} registered on the
              platform
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  });
}
