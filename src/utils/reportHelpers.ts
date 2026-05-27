const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const aggregateByMonth = (
  data: { date: string; value: number }[]
): { month: string; value: number; count: number }[] => {
  const monthMap: Record<string, { value: number; count: number }> = {};
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  data.forEach(item => {
    const date = new Date(item.date);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
    if (!monthMap[key]) {
      monthMap[key] = { value: 0, count: 0 };
    }
    monthMap[key].value += item.value;
    monthMap[key].count += 1;
  });

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [, monthIndex] = key.split('-');
      return {
        month: monthNames[parseInt(monthIndex)],
        value: val.value,
        count: val.count,
      };
    });
};

export const aggregateByStatus = (
  projects: { status: string; grandTotalWithGst: number }[]
): { name: string; value: number; totalAmount: number; color: string }[] => {
  const statusMap: Record<string, { count: number; totalAmount: number }> = {};
  const statusColors: Record<string, string> = {
    draft: '#6B7280',
    sent: '#A16207',
    approved: '#166534',
    expired: '#DC2626',
    completed: '#0891B2',
    cancelled: '#7C3AED',
    pending: '#92400E',
    in_progress: '#D97706',
  };

  projects.forEach(p => {
    const status = p.status?.toLowerCase() || 'unknown';
    if (!statusMap[status]) {
      statusMap[status] = { count: 0, totalAmount: 0 };
    }
    statusMap[status].count += 1;
    statusMap[status].totalAmount += Number(p.grandTotalWithGst) || 0;
  });

  return Object.entries(statusMap).map(([status, data]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    value: data.count,
    totalAmount: data.totalAmount,
    color: statusColors[status] || '#6B7280',
  }));
};

export const groupByRegion = (
  customers: { state?: string; city?: string }[]
): { region: string; count: number }[] => {
  const regionMapping: Record<string, string> = {
    maharashtra: 'West',
    gujarat: 'West',
    goa: 'West',
    rajasthan: 'West',
    'madhya pradesh': 'West',
    delhi: 'North',
    'uttar pradesh': 'North',
    haryana: 'North',
    punjab: 'North',
    uttarakhand: 'North',
    'himachal pradesh': 'North',
    'jammu and kashmir': 'North',
    chandigarh: 'North',
    'tamil nadu': 'South',
    karnataka: 'South',
    kerala: 'South',
    'andhra pradesh': 'South',
    telangana: 'South',
    pondicherry: 'South',
    'west bengal': 'East',
    odisha: 'East',
    bihar: 'East',
    jharkhand: 'East',
    assam: 'East',
    chhattisgarh: 'East',
  };

  const regionCount: Record<string, number> = {
    West: 0,
    North: 0,
    South: 0,
    East: 0,
    Other: 0,
  };

  customers.forEach(c => {
    const state = c.state?.toLowerCase().trim() || '';
    const region = regionMapping[state] || 'Other';
    regionCount[region] = (regionCount[region] || 0) + 1;
  });

  return Object.entries(regionCount)
    .filter(([, count]) => count > 0)
    .map(([region, count]) => ({ region, count }));
};

export const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
    return imagePath;
  return `${API_BASE_URL}/${imagePath}`;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (date: string): string => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-IN").format(value);
};

export const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    draft:
      "px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700",
    sent: "px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800",
    approved:
      "px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800",
    expired:
      "px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700",
    Converted:
      "px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800",
    Pending:
      "px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800",
    Lost: "px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700",
  };
  return (
    map[status] ||
    "px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
  );
};

export const getDaysPendingClass = (days: number): string => {
  if (days > 14) return "text-red-600 font-bold";
  if (days > 7) return "text-amber-600 font-semibold";
  return "text-green-700";
};

export const generateCSV = (data: any[], filename: string): void => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          return typeof val === "string" && val.includes(",")
            ? `"${val}"`
            : val;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const truncateId = (id: string | null): string => {
  if (!id) return "-";
  return id.length > 8 ? id.substring(0, 8) + "…" : id;
};