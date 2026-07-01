import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Package,
  Database,
  Shield,
  UserCog,
  Mail,
  BarChart3,
  Settings,
  type LucideIcon,
  Plus,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  anyPermission?: string[];
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: Plus,
    permission: 'dashboard:view',
    description: 'Overview & Analytics',
  },
  {
    path: '/projects',
    label: 'Projects',
    icon: Plus,
    permission: 'project:view',
    description: 'Manage all projects',
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: Plus,
    permission: 'customer:view',
    description: 'Customer management',
  },
  {
    path: '/products',
    label: 'Products',
    icon: Plus,
    permission: 'quotation:view',
    description: 'Product quotations',
  },
  {
    path: '/masters',
    label: 'Masters',
    icon: Plus,
    anyPermission: ['master:view', 'master:manage'],
    description: 'Master data management',
  },
  {
    path: '/approvals',
    label: 'Approvals',
    icon: Plus,
    anyPermission: ['approval:view', 'approval:manage'],
    description: 'Approval workflows',
  },
  {
    path: '/users',
    label: 'Users & Roles',
    icon: Plus,
    anyPermission: ['user:view', 'role:view'],
    description: 'User & role management',
  },
  {
    path: '/email-logs',
    label: 'Notifications',
    icon: Plus,
    permission: 'email_log:view',
    description: 'Email and WhatsApp logs',
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: Plus,
    permission: 'report:view',
    description: 'MIS & business reports',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Plus,
    permission: 'setting:manage', // or anyPermission: ['admin'] or just rely on 'admin' role having all
    description: 'Manage application settings',
  },
];

export const getVisibleNavItems = (
  hasPermission: (p: string) => boolean,
  hasAnyPermission: (...p: string[]) => boolean,
  excludePaths: string[] = []
): NavItem[] => {
  return NAV_ITEMS.filter((item) => {
    if (excludePaths.includes(item.path)) return false;
    if (item.permission) return hasPermission(item.permission);
    if (item.anyPermission) return hasAnyPermission(...item.anyPermission);
    return false;
  });
};
