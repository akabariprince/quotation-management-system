import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useApi = () => {
  const { accessToken, logout } = useAuth();

  const request = useCallback(
    async (
      method: string,
      endpoint: string,
      body?: any,
      isFormData: boolean = false
    ) => {
      const headers: Record<string, string> = {};

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (body) {
        if (isFormData) {
          config.body = body;
        } else {
          config.body = JSON.stringify(body);
        }
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (response.status === 401) {
        logout();
        toast.error('Session expired. Please login again.');
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || 'Something went wrong';
        throw new Error(errorMessage);
      }

      return data;
    },
    [accessToken, logout]
  );

  const get = useCallback((endpoint: string) => request('GET', endpoint), [request]);

  const post = useCallback(
    (endpoint: string, body: any, isFormData: boolean = false) =>
      request('POST', endpoint, body, isFormData),
    [request]
  );

  const put = useCallback(
    (endpoint: string, body: any, isFormData: boolean = false) =>
      request('PUT', endpoint, body, isFormData),
    [request]
  );

  const patch = useCallback(
    (endpoint: string, body: any) => request('PATCH', endpoint, body),
    [request]
  );

  const del = useCallback(
    (endpoint: string) => request('DELETE', endpoint),
    [request]
  );

  return { get, post, put, patch, del };
};