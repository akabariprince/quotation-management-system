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
  type LucideIcon,
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
    icon: LayoutDashboard,
    permission: 'dashboard:view',
    description: 'Overview & Analytics',
  },
  {
    path: '/projects',
    label: 'Projects',
    icon: FolderKanban,
    permission: 'project:view',
    description: 'Manage all projects',
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: Users,
    permission: 'customer:view',
    description: 'Customer management',
  },
  {
    path: '/products',
    label: 'Products',
    icon: Package,
    permission: 'quotation:view',
    description: 'Product quotations',
  },
  {
    path: '/masters',
    label: 'Masters',
    icon: Database,
    anyPermission: ['master:view', 'master:manage'],
    description: 'Master data management',
  },
  {
    path: '/approvals',
    label: 'Approvals',
    icon: Shield,
    anyPermission: ['approval:view', 'approval:manage'],
    description: 'Approval workflows',
  },
  {
    path: '/users',
    label: 'Users & Roles',
    icon: UserCog,
    anyPermission: ['user:view', 'role:view'],
    description: 'User & role management',
  },
  {
    path: '/email-logs',
    label: 'Email Logs',
    icon: Mail,
    permission: 'email_log:view',
    description: 'Email history & logs',
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: BarChart3,
    permission: 'report:view',
    description: 'MIS & business reports',
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