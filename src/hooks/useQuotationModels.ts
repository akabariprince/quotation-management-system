import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface QuotationModel {
  id: string;
  name: string;
  quotationTypeId: string;
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

export const useQuotationModels = () => {
  const { get, post, put, del } = useApi();
  const [quotationModels, setQuotationModels] = useState<QuotationModel[]>(
    []
  );
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuotationModels = useCallback(
    async (params?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      quotationTypeId?: string;
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
        if (params?.quotationTypeId)
          queryParts.push(`quotationTypeId=${params.quotationTypeId}`);
        if (params?.status) queryParts.push(`status=${params.status}`);

        const queryString =
          queryParts.length > 0
            ? `?${queryParts.join('&')}`
            : '?limit=1000';

        const res = await get(`/quotation-models${queryString}`);
        setQuotationModels(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setQuotationModels([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchQuotationModelById = useCallback(
    async (id: string): Promise<QuotationModel | null> => {
      try {
        const res = await get(`/quotation-models/${id}`);
        return res.data;
      } catch {
        return null;
      }
    },
    [get]
  );

  const createQuotationModel = useCallback(
    async (data: {
      name: string;
      // quotationTypeId: string;
      status?: string;
    }) => {
      const res = await post('/quotation-models', data);
      return res.data;
    },
    [post]
  );

  const updateQuotationModel = useCallback(
    async (id: string, data: Partial<QuotationModel>) => {
      const res = await put(`/quotation-models/${id}`, data);
      return res.data;
    },
    [put]
  );

  const deleteQuotationModel = useCallback(
    async (id: string) => {
      await del(`/quotation-models/${id}`);
    },
    [del]
  );

  const fetchAllQuotationModels = useCallback(async () => {
    try {
      const res = await get('/quotation-models?limit=10000');
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  return {
    quotationModels,
    meta,
    loading,
    fetchQuotationModels,
    fetchQuotationModelById,
    createQuotationModel,
    updateQuotationModel,
    deleteQuotationModel,
    fetchAllQuotationModels,
  };
};