import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface Category {
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

export const useCategories = () => {
  const { get, post, put, del } = useApi();
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async (params?: {
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
      const res = await get(`/categories${queryString}`);
      setCategories(res.data || []);
      if (res.meta) setMeta(res.meta);
      return res;
    } catch {
      setCategories([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchCategoryById = useCallback(async (id: string): Promise<Category | null> => {
    try {
      const res = await get(`/categories/${id}`);
      return res.data;
    } catch {
      return null;
    }
  }, [get]);

  const createCategory = useCallback(async (data: { name: string; status?: string }) => {
    const res = await post('/categories', data);
    return res.data;
  }, [post]);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    const res = await put(`/categories/${id}`, data);
    return res.data;
  }, [put]);

  const deleteCategory = useCallback(async (id: string) => {
    await del(`/categories/${id}`);
  }, [del]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const res = await get('/categories?limit=10000');
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  return {
    categories,
    meta,
    loading,
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchAllCategories,
  };
};