import { useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";

export interface ProjectItem {
  id: string;
  quotationId: string;
  quotationCode: string;
  quotationName: string;
  description: string | null;
  images: string[];
  woodId: string | null;
  woodName: string | null;
  polishId: string | null;
  polishName: string | null;
  fabricId: string | null;
  fabricName: string | null;
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  quantity: number;
  total: number;
  gstPercent: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalWithGst: number;
  notes: string[];
  sortOrder?: number;
  projectQuotationNo?: string;
}

export interface ProjectDetail {
  id: string;
  projectNo: string;
  date: string;
  customerId: string;
  salesPersonId: string | null;
  subtotal: number;
  totalDiscount: number;
  igst: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  grandTotalWithGst: number;
  status: "draft" | "sent" | "approved" | "expired";
  customer?: {
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
  };
  salesPerson?: {
    id: string;
    name: string;
    email: string;
  };
  items?: ProjectItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  projectNo: string;
  date: string;
  customerId: string;
  salesPersonId: string | null;
  subtotal: number;
  totalDiscount: number;
  igst: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  grandTotalWithGst: number;
  status: "draft" | "sent" | "approved" | "expired";
  customer?: {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    city: string | null;
    state: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export interface ProjectStats {
  totalProjects: number;
  draftCount: number;
  sentCount: number;
  approvedCount: number;
  expiredCount: number;
  totalValue: number;
  approvedValue: number;
}

export const useProjects = () => {
  const { get, post, put, patch, del } = useApi();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(
    async (params?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      status?: string;
      customerId?: string;
      startDate?: string;
      endDate?: string;
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
        if (params?.status && params.status !== "all")
          queryParts.push(`status=${params.status}`);
        if (params?.customerId)
          queryParts.push(`customerId=${params.customerId}`);
        if (params?.startDate) queryParts.push(`startDate=${params.startDate}`);
        if (params?.endDate) queryParts.push(`endDate=${params.endDate}`);

        const queryString =
          queryParts.length > 0 ? `?${queryParts.join("&")}` : "?limit=10";

        const res = await get(`/projects${queryString}`);
        setProjects(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setProjects([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get],
  );

  const fetchProjectById = useCallback(
    async (id: string): Promise<ProjectDetail | null> => {
      try {
        const res = await get(`/projects/${id}`);
        return res.data;
      } catch {
        return null;
      }
    },
    [get],
  );

  const getNextProjectNumber = useCallback(
    async (date?: string): Promise<string> => {
      try {
        const query = date ? `?date=${date}` : "";
        const res = await get(`/projects/next-number${query}`);
        return res.data?.projectNo || "PJ-0001";
      } catch {
        return "PJ-0001";
      }
    },
    [get],
  );

  const createProject = useCallback(
    async (data: any) => {
      const res = await post("/projects", data);
      return res.data;
    },
    [post],
  );

  const updateProject = useCallback(
    async (id: string, data: any) => {
      const res = await put(`/projects/${id}`, data);
      return res.data;
    },
    [put],
  );

  const updateProjectStatus = useCallback(
    async (id: string, status: string) => {
      const res = await patch(`/projects/${id}/status`, { status });
      return res.data;
    },
    [patch],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await del(`/projects/${id}`);
    },
    [del],
  );

  const duplicateProject = useCallback(
    async (id: string) => {
      const res = await post(`/projects/${id}/duplicate`, {});
      return res.data;
    },
    [post],
  );

  const fetchStats = useCallback(async (): Promise<ProjectStats | null> => {
    try {
      const res = await get("/projects/stats");
      return res.data;
    } catch {
      return null;
    }
  }, [get]);

  const downloadProjectPDF = useCallback(
    async (projectId: string) => {
      try {
        const token = localStorage.getItem("accessToken");
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        // ★ Use window.fetch directly — completely bypass useApi
        // ★ Do NOT use get() from useApi — it parses response as JSON
        const response = await window.fetch(
          `${API_BASE_URL}/projects/${projectId}/pdf`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              // ★ NO content-type header — we want binary PDF, not JSON
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Download failed (${response.status})`);
        }

        const blob = await response.blob();

        // Extract filename from response header
        const disposition = response.headers.get("Content-Disposition");
        let filename = `project-${projectId}.pdf`;
        if (disposition) {
          const match = disposition.match(/filename="?([^"]+)"?/);
          if (match?.[1]) filename = match[1];
        }

        // Trigger browser download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 150);
      } catch (err: any) {
        console.error("PDF download failed:", err);
      }
    },
    [], // ★ Empty deps — no useApi dependency
  );
  return {
    projects,
    meta,
    loading,
    fetchProjects,
    fetchProjectById,
    getNextProjectNumber,
    createProject,
    updateProject,
    updateProjectStatus,
    deleteProject,
    duplicateProject,
    fetchStats,
    downloadProjectPDF,
  };
};
