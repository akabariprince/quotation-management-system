import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: string[];
  discountMin: number;
  discountMax: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionsMeta {
  allPermissions: string[];
  labels: Record<string, string>;
  groups: Record<string, string[]>;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export const useRoles = () => {
  const { get, post, put, del } = useApi();
  const [roles, setRoles] = useState<Role[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionsMeta, setPermissionsMeta] = useState<PermissionsMeta | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const fetchRoles = useCallback(
    async (params?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      isActive?: string;
    }) => {
      setLoading(true);
      try {
        const queryParts: string[] = [];
        if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (params?.page) queryParts.push(`page=${params.page}`);
        if (params?.limit) queryParts.push(`limit=${params.limit}`);
        if (params?.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
        if (params?.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);
        if (params?.isActive !== undefined) queryParts.push(`isActive=${params.isActive}`);

        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '?limit=100';
        const res = await get(`/roles${queryString}`);
        setRoles(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setRoles([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchActiveRoles = useCallback(async () => {
    try {
      const res = await get('/roles/active');
      return res.data || [];
    } catch {
      return [];
    }
  }, [get]);

  const fetchPermissionsMeta = useCallback(async () => {
    setPermissionsLoading(true);
    try {
      const res = await get('/roles/permissions');
      setPermissionsMeta(res.data || null);
      return res.data;
    } catch {
      setPermissionsMeta(null);
      return null;
    } finally {
      setPermissionsLoading(false);
    }
  }, [get]);

  const fetchRoleById = useCallback(
    async (id: string): Promise<Role | null> => {
      try {
        const res = await get(`/roles/${id}`);
        return res.data;
      } catch {
        return null;
      }
    },
    [get]
  );

  const createRole = useCallback(
    async (data: {
      name: string;
      displayName: string;
      description?: string;
      permissions: string[];
      isActive?: boolean;
    }) => {
      const res = await post('/roles', data);
      return res.data;
    },
    [post]
  );

  const updateRole = useCallback(
    async (
      id: string,
      data: {
        displayName?: string;
        description?: string;
        permissions?: string[];
        isActive?: boolean;
      }
    ) => {
      const res = await put(`/roles/${id}`, data);
      return res.data;
    },
    [put]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      await del(`/roles/${id}`);
    },
    [del]
  );

  return {
    roles,
    meta,
    loading,
    permissionsMeta,
    permissionsLoading,
    fetchRoles,
    fetchActiveRoles,
    fetchPermissionsMeta,
    fetchRoleById,
    createRole,
    updateRole,
    deleteRole,
  };
};