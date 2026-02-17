import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  role: {
    id: string;
    name: string;
    displayName: string;
  };
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export const useUsers = () => {
  const { get, post, put, del } = useApi();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(
    async (params?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      roleId?: string;
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
        if (params?.roleId) queryParts.push(`roleId=${params.roleId}`);
        if (params?.isActive !== undefined) queryParts.push(`isActive=${params.isActive}`);

        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '?limit=10';
        const res = await get(`/users${queryString}`);
        setUsers(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setUsers([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchUserById = useCallback(
    async (id: string): Promise<SystemUser | null> => {
      try {
        const res = await get(`/users/${id}`);
        return res.data;
      } catch {
        return null;
      }
    },
    [get]
  );

  const createUser = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      roleId: string;
      isActive?: boolean;
    }) => {
      const res = await post('/users', data);
      return res.data;
    },
    [post]
  );

  const updateUser = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        email?: string;
        password?: string;
        roleId?: string;
        isActive?: boolean;
      }
    ) => {
      const res = await put(`/users/${id}`, data);
      return res.data;
    },
    [put]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      await del(`/users/${id}`);
    },
    [del]
  );

  return {
    users,
    meta,
    loading,
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
  };
};