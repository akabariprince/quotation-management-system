import React from 'react';
import { NavLink } from 'react-router-dom';
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
  UserCog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasPermission } = useAuth();

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
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col h-screen transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">ecstatics.</h1>
              <p className="text-xs text-muted-foreground">Quotation System</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-hidden">
          {navItems.filter(item => item.show).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'nav-item',
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-border flex-shrink-0">
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
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
