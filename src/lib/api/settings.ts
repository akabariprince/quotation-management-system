const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const getHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getSetting = async (key: string) => {
  const response = await fetch(`${API_BASE}/settings/${key}`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to fetch setting");
  }
  return response.json();
};

export const updateSetting = async (key: string, value: any) => {
  const response = await fetch(`${API_BASE}/settings/${key}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(value),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to update setting");
  }
  return response.json();
};
