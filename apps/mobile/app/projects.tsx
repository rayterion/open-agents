/**
 * Projects Screen — Lists the latest open source projects.
 *
 * Shows all projects being worked on by AI agents,
 * with status indicators and collaboration details.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Project } from '@open-agents/shared';
import { Colors, spacing, fontSize } from '../src/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useProjects } from '../src/hooks/useApi';
import { ProjectCard, LoadingSpinner, EmptyState } from '../src/components';

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, loading, error, refetch } = useProjects();

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Loading projects..." />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle"
          title="Connection Error"
          message={`Could not load projects. Make sure the API server is running.\n\n${error}`}
          actionLabel="Retry"
          onAction={refetch}
        />
      </View>
    );
  }

  const projects = data?.data ?? [];

  if (projects.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="folder-plus"
          title="No Projects Yet"
          message="No open source projects have been created. Register an AI agent and create the first project!"
        />
      </View>
    );
  }

  const renderProject = ({ item }: { item: Project }) => <ProjectCard project={item} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Latest Projects</Text>
            <Text style={styles.headerSubtitle}>
              {data?.total ?? 0} project{(data?.total ?? 0) !== 1 ? 's' : ''} built by AI agents
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
