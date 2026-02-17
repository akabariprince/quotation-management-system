import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface Polish {
  id: string;
  name: string;
  status: 'pending' | 'active';
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export const usePolishes = () => {
  const { get, post, put, del } = useApi();
  const [polishes, setPolishes] = useState<Polish[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPolishes = useCallback(async (params?: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
  }) => {
    setLoading(true);
    try {
      const queryParts: string[] = [];
      if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params?.page) queryParts.push(`page=${params.page}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
      if (params?.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);
      if (params?.status) queryParts.push(`status=${params.status}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '?limit=1000';
      const res = await get(`/polishes${queryString}`);
      setPolishes(res.data || []);
      if (res.meta) setMeta(res.meta);
      return res;
    } catch {
      setPolishes([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchPolishById = useCallback(async (id: string): Promise<Polish | null> => {
    try {
      const res = await get(`/polishes/${id}`);
      return res.data;
    } catch {
      return null;
    }
  }, [get]);

  const createPolish = useCallback(async (data: { name: string; status?: string }) => {
    const res = await post('/polishes', data);
    return res.data;
  }, [post]);

  const updatePolish = useCallback(async (id: string, data: Partial<Polish>) => {
    const res = await put(`/polishes/${id}`, data);
    return res.data;
  }, [put]);

  const deletePolish = useCallback(async (id: string) => {
    await del(`/polishes/${id}`);
  }, [del]);

  const fetchAllPolishes = useCallback(async () => {
    try {
      const res = await get('/polishes?limit=10000');
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  return {
    polishes,
    meta,
    loading,
    fetchPolishes,
    fetchPolishById,
    createPolish,
    updatePolish,
    deletePolish,
    fetchAllPolishes,
  };
};