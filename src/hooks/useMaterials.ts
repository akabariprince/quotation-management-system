import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface Material {
  id: string;
  name: string;
  status: 'pending' | 'active';
}

export const useMaterials = () => {
  const { get } = useApi();
  const [woods, setWoods] = useState<Material[]>([]);
  const [polishes, setPolishes] = useState<Material[]>([]);
  const [fabrics, setFabrics] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [woodsRes, polishesRes, fabricsRes] = await Promise.all([
        get('/woods?limit=1000&status=active'),
        get('/polishes?limit=1000&status=active'),
        get('/fabrics?limit=1000&status=active'),
      ]);
      setWoods(woodsRes.data || []);
      setPolishes(polishesRes.data || []);
      setFabrics(fabricsRes.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchAll();
  }, []);

  return { woods, polishes, fabrics, loading, fetchAll };
};