import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings,
  BarChart3,
  LogOut,
  Database
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { path: '/quotations', label: 'Quotations', icon: FileText, show: true },
    { path: '/customers', label: 'Customers', icon: Users, show: true },
    { path: '/products', label: 'Products', icon: Package, show: true },
    { path: '/masters', label: 'Masters', icon: Database, show: hasPermission('edit_masters') || user?.role === 'admin' },
    { path: '/reports', label: 'MIS Reports', icon: BarChart3, show: hasPermission('view_reports') || user?.role === 'admin' },
  ];

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="font-semibold text-foreground">ecstatics.</h1>
            <p className="text-xs text-muted-foreground">Quotation System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.filter(item => item.show).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'nav-item',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center">
            <span className="text-accent font-medium text-sm">
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
      </div>
    </aside>
  );
};

export default Sidebar;
