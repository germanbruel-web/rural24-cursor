/**
 * API Client - BFF Backend
 * Cliente HTTP para comunicarse con el backend Next.js
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Request failed',
        response.status,
        data.fields
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 500);
  }
}

export { API_URL, fetchApi, ApiError };
export type { ApiResponse, PaginatedResponse };
