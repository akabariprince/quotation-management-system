import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getVisibleNavItems } from '@/config/navigation';
import { LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const RoleLayout: React.FC = () => {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const isDashboard =
    location.pathname === '/dashboard' || location.pathname === '/';

  const allVisibleItems = getVisibleNavItems(hasPermission, hasAnyPermission);

  // ─── Dashboard: Full-Width ───
  if (isDashboard) {
    return (
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-card border-b-2 border-primary/15 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-bold text-xl">
                  E
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-foreground leading-tight text-lg">
                  ecstatics.
                </h1>
                <p className="text-xs text-muted-foreground">
                  Quotation Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/15 rounded-full flex items-center justify-center">
                  <span className="text-accent font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role?.displayName}
                  </p>
                </div>
              </div>

              <div className="w-px h-8 bg-border hidden sm:block" />

              <button
                onClick={logout}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ─── Module Pages: Large Card Sidebar + Content ───
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {mobileNavOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-primary/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Large Card Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-[260px] lg:w-[110px] bg-card border-r-2 border-primary/15',
          'flex flex-col h-screen transition-transform duration-300 ease-in-out',
          mobileNavOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b-2 border-primary/10 flex items-center justify-between flex-shrink-0">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileNavOpen(false)}
          >
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-primary-foreground font-bold text-xl">
                E
              </span>
            </div>
            <span className="font-bold text-foreground text-lg lg:hidden">
              ecstatics.
            </span>
          </NavLink>

          <button
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-2.5 hover:bg-secondary/30 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation — Large Card Items */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {allVisibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileNavOpen(false)}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  // Mobile: horizontal layout
                  'flex items-center lg:flex-col gap-3 lg:gap-1.5',
                  // Large card style
                  'p-3.5 lg:p-3 rounded-xl transition-all duration-200',
                  'group border-2',
                  isActive
                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                    : 'border-transparent text-muted-foreground hover:bg-secondary/20 hover:border-secondary hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'w-11 h-11 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center',
                      'transition-all flex-shrink-0',
                      isActive
                        ? 'bg-accent text-white shadow-md'
                        : 'bg-secondary/30 text-primary group-hover:bg-secondary/50'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="lg:text-center flex-1 lg:flex-none">
                    <span className="text-sm lg:text-[11px] font-semibold leading-tight block">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground lg:hidden">
                      {item.description}
                    </span>
                  </div>
                </>
              )}
            </NavLink>
          ))}

          {allVisibleItems.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8 px-2">
              No modules available.
              <br />
              Contact admin for access.
            </div>
          )}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t-2 border-primary/10 flex-shrink-0">
          {/* Desktop */}
          <div className="hidden lg:flex flex-col items-center gap-2 py-2">
            <div
              className="w-11 h-11 bg-accent/15 rounded-full flex items-center justify-center border-2 border-accent/30"
              title={`${user?.name} (${user?.role?.displayName})`}
            >
              <span className="text-accent font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-secondary/40 mb-2">
              <div className="w-10 h-10 bg-accent/15 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.role?.displayName}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card border-b-2 border-primary/15">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2.5 hover:bg-secondary/30 rounded-xl transition-colors"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  E
                </span>
              </div>
              <span className="font-bold text-foreground">ecstatics.</span>
            </div>
          </div>

          <NavLink
            to="/dashboard"
            className="p-2.5 hover:bg-secondary/30 rounded-xl transition-colors"
            title="Dashboard"
          >
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoleLayout;