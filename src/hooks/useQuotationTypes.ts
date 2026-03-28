import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface QuotationType {
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

export const useQuotationTypes = () => {
  const { get, post, put, del } = useApi();
  const [quotationTypes, setQuotationTypes] = useState<QuotationType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuotationTypes = useCallback(
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
        if (params?.search)
          queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (params?.page) queryParts.push(`page=${params.page}`);
        if (params?.limit) queryParts.push(`limit=${params.limit}`);
        if (params?.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
        if (params?.sortOrder)
          queryParts.push(`sortOrder=${params.sortOrder}`);
        if (params?.status) queryParts.push(`status=${params.status}`);

        const queryString =
          queryParts.length > 0
            ? `?${queryParts.join('&')}`
            : '?limit=1000';

        const res = await get(`/quotation-types${queryString}`);
        setQuotationTypes(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setQuotationTypes([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchQuotationTypeById = useCallback(
    async (id: string): Promise<QuotationType | null> => {
      try {
        const res = await get(`/quotation-types/${id}`);
        return res.data;
      } catch {
        return null;
      }
    },
    [get]
  );

  const createQuotationType = useCallback(
    async (data: { name: string; status?: string }) => {
      const res = await post('/quotation-types', data);
      return res.data;
    },
    [post]
  );

  const updateQuotationType = useCallback(
    async (id: string, data: Partial<QuotationType>) => {
      const res = await put(`/quotation-types/${id}`, data);
      return res.data;
    },
    [put]
  );

  const deleteQuotationType = useCallback(
    async (id: string) => {
      await del(`/quotation-types/${id}`);
    },
    [del]
  );

  const fetchAllQuotationTypes = useCallback(async () => {
    try {
      const res = await get('/quotation-types?limit=10000');
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  return {
    quotationTypes,
    meta,
    loading,
    fetchQuotationTypes,
    fetchQuotationTypeById,
    createQuotationType,
    updateQuotationType,
    deleteQuotationType,
    fetchAllQuotationTypes,
  };
};