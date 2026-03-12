import { useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface Quotation {
  id: string;
  name: string;
  partCode: string;
  categoryId: string;
  categoryNoId?: string;
  quotationTypeId: string;
  quotationModelId: string;
  variantId?: string;
  woodId?: string;
  polishId?: string;
  fabricId?: string;
  length: number;
  width: number;
  height: number;
  description: string;
  basePrice: number;
  defaultDiscount: number;
  gstPercent: number;
  images: string[];
  status: "pending" | "active";
  category?: { id: string; name: string };
  quotationType?: { id: string; name: string };
  quotationModel?: { id: string; name: string };
  categoryNo?: { id: string; name: string };
  variant?: { id: string; name: string };
  wood?: { id: string; name: string };
  polish?: { id: string; name: string };
  fabric?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export const getQuotationImageUrl = (imagePath: string): string => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
    return imagePath;
  return `${API_BASE_URL}/${imagePath}`;
};

export const useQuotations = () => {
  const { get, post, put, del } = useApi();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuotations = useCallback(
    async (params?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      categoryId?: string;
      categoryNoId?: string;
      quotationTypeId?: string;
      variantId?: string;
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
        if (params?.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);
        if (params?.categoryId)
          queryParts.push(`categoryId=${params.categoryId}`);
        if (params?.categoryNoId)
          queryParts.push(`categoryNoId=${params.categoryNoId}`);
        if (params?.quotationTypeId)
          queryParts.push(`quotationTypeId=${params.quotationTypeId}`);
        if (params?.variantId) queryParts.push(`variantId=${params.variantId}`);
        if (params?.status) queryParts.push(`status=${params.status}`);
        const queryString =
          queryParts.length > 0 ? `?${queryParts.join("&")}` : "?limit=12";
        const res = await get(`/quotations${queryString}`);
        setQuotations(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setQuotations([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get],
  );

  const fetchQuotationById = useCallback(
    async (id: string): Promise<Quotation | null> => {
      try {
        const res = await get(`/quotations/${id}`);
        return res.data;
      } catch {
        return null;
      }
    },
    [get],
  );

  const createQuotation = useCallback(
    async (data: FormData | Record<string, any>) => {
      if (data instanceof FormData) {
        const res = await post("/quotations", data, true);
        return res.data;
      }
      const res = await post("/quotations", data);
      return res.data;
    },
    [post],
  );

  const updateQuotation = useCallback(
    async (id: string, data: FormData | Record<string, any>) => {
      if (data instanceof FormData) {
        const res = await put(`/quotations/${id}`, data, true);
        return res.data;
      }
      const res = await put(`/quotations/${id}`, data);
      return res.data;
    },
    [put],
  );

  const deleteQuotation = useCallback(
    async (id: string) => {
      await del(`/quotations/${id}`);
    },
    [del],
  );

  const fetchAllActive = useCallback(async (): Promise<Quotation[]> => {
    try {
      const res = await get("/quotations?limit=10000&status=active");
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  const searchQuotations = useCallback(
    async (search: string, limit: number = 20): Promise<Quotation[]> => {
      try {
        const res = await get(
          `/quotations?search=${encodeURIComponent(search)}&limit=${limit}&status=active&sortBy=updatedAt&sortOrder=DESC`,
        );
        return res.data || [];
      } catch {
        return [];
      }
    },
    [get],
  );

  const fetchAllQuotations = useCallback(async () => {
    try {
      const res = await get("/quotations?limit=10000");
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  // Find quotation by the 4 part-code filter fields
  const findByPartCodeFilters = useCallback(
    async (params: {
      categoryId: string;
      categoryNoId: string;
      quotationTypeId: string;
      variantId: string;
    }): Promise<Quotation | null> => {
      try {
        const queryParts = [
          `categoryId=${params.categoryId}`,
          `categoryNoId=${params.categoryNoId}`,
          `quotationTypeId=${params.quotationTypeId}`,
          `variantId=${params.variantId}`,
          `status=active`,
          `limit=1`,
        ];
        const res = await get(`/quotations?${queryParts.join("&")}`);
        return res.data?.[0] || null;
      } catch {
        return null;
      }
    },
    [get],
  );

  return {
    quotations,
    meta,
    loading,
    fetchQuotations,
    fetchQuotationById,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    fetchAllActive,
    searchQuotations,
    fetchAllQuotations,
    findByPartCodeFilters,
  };
};
