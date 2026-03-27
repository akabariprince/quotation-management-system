import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getVisibleNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();

  const visibleNavItems = getVisibleNavItems(hasPermission, hasAnyPermission);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose();
  };

  const handleLogoClick = () => {
    if (window.innerWidth < 1024) onClose();
    else onToggleCollapse();
  };

  const handleCloseOrCollapse = () => {
    if (window.innerWidth < 1024) onClose();
    else onToggleCollapse();
  };

  const getRoleDisplayName = (): string => {
    if (!user) return '';
    return user.role?.displayName || user.role?.name || '';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-primary/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar — wider */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-card border-r-2 border-primary/20',
          'flex flex-col h-screen transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-[82px]' : 'w-[280px]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Area */}
        <div className="p-5 border-b-2 border-primary/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md flex-shrink-0 cursor-pointer"
              onClick={handleLogoClick}
              title={isCollapsed ? 'Expand sidebar' : 'ecstatics.'}
            >
              <span className="text-primary-foreground font-bold text-xl">
                E
              </span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-foreground text-lg">
                  ecstatics.
                </h1>
                <p className="text-xs text-muted-foreground">
                  Quotation Management
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleCloseOrCollapse}
              className="p-2.5 hover:bg-secondary/30 rounded-xl transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5 text-muted-foreground lg:hidden" />
              <PanelLeftClose className="h-5 w-5 text-muted-foreground hidden lg:block" />
            </button>
          )}
        </div>

        {/* Navigation — bigger items */}
        <nav
          className={cn(
            'flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden',
            isCollapsed && 'px-2'
          )}
        >
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-200 font-medium',
                  isActive
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary/30 hover:text-foreground',
                  isCollapsed
                    ? 'justify-center p-3.5'
                    : 'px-4 py-3.5'
                )
              }
            >
              <item.icon className={cn('flex-shrink-0', isCollapsed ? 'h-6 w-6' : 'h-5 w-5')} />
              {!isCollapsed && (
                <span className="text-sm ">{item.label}</span>
              )}
            </NavLink>
          ))}

          {visibleNavItems.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No menu items available.
              <br />
              Contact admin for permissions.
            </div>
          )}
        </nav>

        {/* Collapse Toggle (Desktop) */}
        {/* <div className="hidden lg:block px-3 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-2 w-full justify-center px-4 py-3 rounded-xl
                       text-muted-foreground hover:bg-secondary/30 hover:text-foreground
                       transition-colors text-sm font-medium"
            title={isCollapsed ? 'Expand' : 'Minimize'}
          >
            {isCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>Minimize</span>
              </>
            )}
          </button>
        </div> */}

        {/* User Info — bigger */}
        <div className="p-3 border-t-2 border-primary/10 flex-shrink-0">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-11 h-11 bg-accent/15 rounded-full flex items-center justify-center"
                title={`${user?.name} (${getRoleDisplayName()})`}
              >
                <span className="text-accent font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-secondary/20 border border-secondary/40">
                <div className="w-11 h-11 bg-accent/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getRoleDisplayName()}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
                           text-destructive hover:bg-destructive/10 hover:text-destructive
                           transition-colors text-sm font-medium"
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