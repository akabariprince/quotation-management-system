import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface Wood {
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

export const useWoods = () => {
  const { get, post, put, del } = useApi();
  const [woods, setWoods] = useState<Wood[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWoods = useCallback(async (params?: {
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
      const res = await get(`/woods${queryString}`);
      setWoods(res.data || []);
      if (res.meta) setMeta(res.meta);
      return res;
    } catch {
      setWoods([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchWoodById = useCallback(async (id: string): Promise<Wood | null> => {
    try {
      const res = await get(`/woods/${id}`);
      return res.data;
    } catch {
      return null;
    }
  }, [get]);

  const createWood = useCallback(async (data: { name: string; status?: string }) => {
    const res = await post('/woods', data);
    return res.data;
  }, [post]);

  const updateWood = useCallback(async (id: string, data: Partial<Wood>) => {
    const res = await put(`/woods/${id}`, data);
    return res.data;
  }, [put]);

  const deleteWood = useCallback(async (id: string) => {
    await del(`/woods/${id}`);
  }, [del]);

  const fetchAllWoods = useCallback(async () => {
    try {
      const res = await get('/woods?limit=10000');
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  return {
    woods,
    meta,
    loading,
    fetchWoods,
    fetchWoodById,
    createWood,
    updateWood,
    deleteWood,
    fetchAllWoods,
  };
};