import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  LogOut,
  Database,
  X,
  Shield,
  Mail,
  UserCog,
  PanelLeftClose,
  PanelLeft,
  Plus,
  UserPlus,
  FilePlus,
} from 'lucide-react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  permission?: Permission;
  adminOnly?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { path: '/quotations', label: 'Quotations', icon: FileText, show: true },
    { path: '/customers', label: 'Customers', icon: Users, show: true },
    { path: '/products', label: 'Products', icon: Package, show: true },
    { path: '/masters', label: 'Masters', icon: Database, show: hasPermission('edit_masters') || user?.role === 'admin' },
    { path: '/approvals', label: 'Approvals', icon: Shield, show: user?.role === 'admin' },
    { path: '/users', label: 'User Management', icon: UserCog, show: user?.role === 'admin' },
    { path: '/email-logs', label: 'Email Logs', icon: Mail, show: user?.role === 'admin' },
    { path: '/reports', label: 'MIS Reports', icon: BarChart3, show: hasPermission('view_reports') || user?.role === 'admin' },
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[68px]" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 cursor-pointer"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
                else onToggleCollapse();
              }}
            >
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-semibold text-foreground">ecstatics.</h1>
                <p className="text-xs text-muted-foreground">Quotation System</p>
              </div>
            )}
          </div>
          {/* Mobile Close / Desktop Toggle */}
          {!isCollapsed && (
            <button
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
                else onToggleCollapse();
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              {window.innerWidth < 1024 ? (
                <X className="h-5 w-5 text-muted-foreground" />
              ) : (
                <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden", isCollapsed && "px-2")}>
          {navItems.filter(item => item.show).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'nav-item',
                  isActive ? 'nav-item-active' : 'nav-item-inactive',
                  isCollapsed && 'justify-center px-2'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle (Desktop only, at bottom before user) */}
        <div className="hidden lg:block px-3 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="nav-item nav-item-inactive w-full justify-center"
          >
            {isCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <span className="flex items-center gap-2 w-full">
                <PanelLeftClose className="h-5 w-5" />
                <span>Minimize</span>
              </span>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="p-3 border-t border-border flex-shrink-0">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center"
                title={user?.name}
              >
                <span className="text-accent font-semibold text-sm">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-muted/50">
                <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-semibold text-sm">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="nav-item nav-item-inactive w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;