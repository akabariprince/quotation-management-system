import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface Variant {
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

export const useVariants = () => {
  const { get, post, put, del } = useApi();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVariants = useCallback(
    async (params?: {
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
        const res = await get(`/variants${queryString}`);
        setVariants(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setVariants([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get],
  );

  const createVariant = useCallback(
    async (data: { name: string; status?: string }) => {
      const res = await post('/variants', data);
      return res.data;
    },
    [post],
  );

  const updateVariant = useCallback(
    async (id: string, data: Partial<Variant>) => {
      const res = await put(`/variants/${id}`, data);
      return res.data;
    },
    [put],
  );

  const deleteVariant = useCallback(
    async (id: string) => {
      await del(`/variants/${id}`);
    },
    [del],
  );

  return {
    variants,
    meta,
    loading,
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
  };
};