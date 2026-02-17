import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  gstin: string | null;
  contactPerson: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export const useCustomers = () => {
  const { get, post, put, del } = useApi();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async (params?: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    state?: string;
    region?: string;
    city?: string;
  }) => {
    setLoading(true);
    try {
      const queryParts: string[] = [];
      if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params?.page) queryParts.push(`page=${params.page}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
      if (params?.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);
      if (params?.state) queryParts.push(`state=${encodeURIComponent(params.state)}`);
      if (params?.region) queryParts.push(`region=${encodeURIComponent(params.region)}`);
      if (params?.city) queryParts.push(`city=${encodeURIComponent(params.city)}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '?limit=10';
      const res = await get(`/customers${queryString}`);
      setCustomers(res.data || []);
      if (res.meta) setMeta(res.meta);
      return res;
    } catch {
      setCustomers([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchCustomerById = useCallback(async (id: string): Promise<Customer | null> => {
    try {
      const res = await get(`/customers/${id}`);
      return res.data;
    } catch {
      return null;
    }
  }, [get]);

  const createCustomer = useCallback(async (data: Omit<Customer, 'id'>) => {
    const res = await post('/customers', data);
    return res.data;
  }, [post]);

  const updateCustomer = useCallback(async (id: string, data: Partial<Customer>) => {
    const res = await put(`/customers/${id}`, data);
    return res.data;
  }, [put]);

  const deleteCustomer = useCallback(async (id: string) => {
    await del(`/customers/${id}`);
  }, [del]);

  // Fetch all for dropdowns (no pagination)
  const fetchAllCustomers = useCallback(async () => {
    try {
      const res = await get('/customers?limit=10000');
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  // Search customers for autocomplete dropdowns
  const searchCustomers = useCallback(async (search: string, limit: number = 20) => {
    try {
      const res = await get(
        `/customers?search=${encodeURIComponent(search)}&limit=${limit}&sortBy=updatedAt&sortOrder=DESC`
      );
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  return {
    customers,
    meta,
    loading,
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    fetchAllCustomers,
    searchCustomers,
  };
};