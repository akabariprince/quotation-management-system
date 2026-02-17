import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface SalesPerson {
  id: string;
  name: string;
  email: string;
  role?: {
    id: string;
    name: string;
    displayName: string;
  };
}

export const useSalesPersons = () => {
  const { get } = useApi();
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSalesPersons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/users/sales-persons');
      setSalesPersons(res.data || []);
      return res.data || [];
    } catch {
      setSalesPersons([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchSalesPersons();
  }, []);

  return { salesPersons, loading, fetchSalesPersons };
};