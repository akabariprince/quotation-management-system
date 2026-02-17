import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface Fabric {
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

export const useFabrics = () => {
  const { get, post, put, del } = useApi();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFabrics = useCallback(async (params?: {
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
      const res = await get(`/fabrics${queryString}`);
      setFabrics(res.data || []);
      if (res.meta) setMeta(res.meta);
      return res;
    } catch {
      setFabrics([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchFabricById = useCallback(async (id: string): Promise<Fabric | null> => {
    try {
      const res = await get(`/fabrics/${id}`);
      return res.data;
    } catch {
      return null;
    }
  }, [get]);

  const createFabric = useCallback(async (data: { name: string; status?: string }) => {
    const res = await post('/fabrics', data);
    return res.data;
  }, [post]);

  const updateFabric = useCallback(async (id: string, data: Partial<Fabric>) => {
    const res = await put(`/fabrics/${id}`, data);
    return res.data;
  }, [put]);

  const deleteFabric = useCallback(async (id: string) => {
    await del(`/fabrics/${id}`);
  }, [del]);

  const fetchAllFabrics = useCallback(async () => {
    try {
      const res = await get('/fabrics?limit=10000');
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  return {
    fabrics,
    meta,
    loading,
    fetchFabrics,
    fetchFabricById,
    createFabric,
    updateFabric,
    deleteFabric,
    fetchAllFabrics,
  };
};