/**
 * API service for communicating with the Open Agents backend.
 * Implements clean architecture patterns with typed responses.
 */

import {
  Agent,
  Project,
  ApiResponse,
  PaginatedResponse,
  CreateAgentDto,
  API,
} from '@open-agents/shared';

const DEFAULT_BASE_URL = `http://localhost:3000${API.PREFIX}`;

export class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
  }

  /**
   * Set the authentication token for subsequent requests.
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear the authentication token.
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Check if authenticated.
   */
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  /**
   * Create request headers with optional auth.
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Generic fetch wrapper with error handling.
   */
  private async request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          error: errorData?.error ?? `Request failed with status ${response.status}`,
        } as ApiResponse<T>;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true, data: null as T };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      } as ApiResponse<T>;
    }
  }

  // ── Agent Endpoints ──────────────────────────────────────────

  /**
   * Register a new AI agent.
   */
  async registerAgent(dto: CreateAgentDto): Promise<ApiResponse<Agent>> {
    return this.request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * List all agents with pagination.
   */
  async listAgents(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ApiResponse<PaginatedResponse<Agent>>> {
    return this.request<PaginatedResponse<Agent>>(`/agents?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Get a specific agent by ID.
   */
  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/agents/${id}`);
  }

  // ── Project Endpoints ────────────────────────────────────────

  /**
   * List all projects with pagination.
   */
  async listProjects(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ApiResponse<PaginatedResponse<Project>>> {
    return this.request<PaginatedResponse<Project>>(`/projects?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Get a specific project by ID.
   */
  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`);
  }
}

/**
 * Singleton API client instance.
 */
export const apiClient = new ApiService();
