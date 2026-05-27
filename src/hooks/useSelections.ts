import { useCallback, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { PaginationMeta } from "@/hooks/useWoods";

export type SelectionCategory =
  | "wood"
  | "fabric"
  | "leather"
  | "leather-rite"
  | "metal"
  | "glass"
  | "stone"
  | "polish"
  | "paint";

export interface SelectionValue {
  id: string;
  name: string;
  sortOrder?: number;
  status?: "pending" | "active";
}

export interface Selection {
  id: string;
  name: string;
  category: SelectionCategory;
  type: "variant-connected" | "general";
  status: "pending" | "active";
  variantMappings?: Array<{
    id: string;
    variantId: string;
    variant?: { id: string; name: string; status: "pending" | "active" };
  }>;
  values?: SelectionValue[];
  createdAt?: string;
  updatedAt?: string;
}

export const SELECTION_CATEGORY_LABELS: Record<SelectionCategory, string> = {
  wood: "Wood",
  fabric: "Fabric",
  leather: "Leather",
  "leather-rite": "Leather-rite",
  metal: "Metal",
  glass: "Glass",
  stone: "Stone",
  polish: "Polish",
  paint: "Paint",
};

export const VARIANT_SELECTION_CATEGORIES: SelectionCategory[] = [
  "wood",
  "fabric",
  "leather",
  "leather-rite",
];

export const GENERAL_SELECTION_CATEGORIES: SelectionCategory[] = [
  "metal",
  "glass",
  "stone",
  "polish",
  "paint",
];

export const getSelectionCategoryFromName = (name: string): SelectionCategory => {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, "-");
  if (normalized === "leatherrite" || normalized === "leather-rite") return "leather-rite";
  if (
    normalized === "wood" ||
    normalized === "fabric" ||
    normalized === "leather" ||
    normalized === "metal" ||
    normalized === "glass" ||
    normalized === "stone" ||
    normalized === "polish" ||
    normalized === "paint"
  ) {
    return normalized as SelectionCategory;
  }
  return "wood";
};

export const useSelections = () => {
  const { get, post, put, del } = useApi();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSelections = useCallback(
    async (params?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      status?: string;
      type?: string;
      category?: string;
    }) => {
      setLoading(true);
      try {
        const queryParts: string[] = [];
        if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (params?.page) queryParts.push(`page=${params.page}`);
        if (params?.limit) queryParts.push(`limit=${params.limit}`);
        if (params?.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
        if (params?.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);
        if (params?.status) queryParts.push(`status=${params.status}`);
        if (params?.type) queryParts.push(`type=${params.type}`);
        if (params?.category) queryParts.push(`category=${params.category}`);

        const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "?limit=1000";
        const res = await get(`/selections${queryString}`);
        setSelections(res.data || []);
        if (res.meta) setMeta(res.meta);
        return res;
      } catch {
        setSelections([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get],
  );

  const createSelection = useCallback(
    async (data: {
      name: string;
      category: SelectionCategory;
      type: "variant-connected" | "general";
      variantIds?: string[];
      values?: Array<{ name: string; sortOrder?: number }>;
      status?: string;
    }) => {
      const res = await post("/selections", data);
      return res.data;
    },
    [post],
  );

  const updateSelection = useCallback(
    async (
      id: string,
      data: Partial<Selection> & {
        variantIds?: string[];
        values?: Array<{ name: string; sortOrder?: number }>;
      },
    ) => {
      const res = await put(`/selections/${id}`, data);
      return res.data;
    },
    [put],
  );

  const deleteSelection = useCallback(
    async (id: string) => {
      await del(`/selections/${id}`);
    },
    [del],
  );

  return {
    selections,
    meta,
    loading,
    fetchSelections,
    createSelection,
    updateSelection,
    deleteSelection,
  };
};
