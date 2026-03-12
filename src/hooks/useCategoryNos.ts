import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface CategoryNo {
  id: string;
  name: string;
  categoryId: string;
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

export const useCategoryNos = () => {
  const { get, post, put, del } = useApi();
  const [categoryNos, setCategoryNos] = useState<CategoryNo[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategoryNos = useCallback(
    async (params?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      categoryId?: string;
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
        if (params?.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
        if (params?.status) queryParts.push(`status=${params.status}`);
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '?limit=1000';
        const res = await get(`/category-nos${queryString}`);
        setCategoryNos(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setCategoryNos([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get],
  );

  const createCategoryNo = useCallback(
    async (data: { name: string; categoryId: string; status?: string }) => {
      const res = await post('/category-nos', data);
      return res.data;
    },
    [post],
  );

  const updateCategoryNo = useCallback(
    async (id: string, data: Partial<CategoryNo>) => {
      const res = await put(`/category-nos/${id}`, data);
      return res.data;
    },
    [put],
  );

  const deleteCategoryNo = useCallback(
    async (id: string) => {
      await del(`/category-nos/${id}`);
    },
    [del],
  );

  return {
    categoryNos,
    meta,
    loading,
    fetchCategoryNos,
    createCategoryNo,
    updateCategoryNo,
    deleteCategoryNo,
  };
};