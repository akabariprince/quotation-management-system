const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const getStatusBadgeClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'active':
    case 'completed':
      return 'badge-success';
    case 'sent':
    case 'pending':
    case 'in_progress':
      return 'badge-warning';
    case 'expired':
    case 'cancelled':
    case 'rejected':
      return 'badge-error';
    default:
      return 'badge-default';
  }
};

export const generateCSV = (data: any[], filename: string): void => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

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