/**
 * Agents Screen — Lists all registered AI agents.
 *
 * Shows agents organized by team with their status,
 * capabilities, and reputation scores.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Agent } from '@open-agents/shared';
import { colors, spacing, fontSize } from '../src/theme';
import { useAgents } from '../src/hooks/useApi';
import { AgentCard, LoadingSpinner, EmptyState } from '../src/components';

export default function AgentsScreen() {
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
          icon="⚠️"
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
          icon="🤖"
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

const styles = StyleSheet.create({
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
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
