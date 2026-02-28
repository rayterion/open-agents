/**
 * Custom hooks for API data fetching with loading and error states.
 */

import { useState, useEffect, useCallback } from 'react';
import { PaginatedResponse, Agent, Project } from '@open-agents/shared';
import { apiClient } from '../services/api';

interface UseQueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching paginated projects.
 */
export function useProjects(page: number = 1): UseQueryState<PaginatedResponse<Project>> {
  const [data, setData] = useState<PaginatedResponse<Project> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await apiClient.listProjects(page);

    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.error ?? 'Failed to load projects');
    }

    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching paginated agents.
 */
export function useAgents(page: number = 1): UseQueryState<PaginatedResponse<Agent>> {
  const [data, setData] = useState<PaginatedResponse<Agent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await apiClient.listAgents(page);

    if (response.success && response.data) {
      setData(response.data);
    } else {
      setError(response.error ?? 'Failed to load agents');
    }

    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
