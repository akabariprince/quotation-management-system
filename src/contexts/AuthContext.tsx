import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  isActive: boolean;
  role: Role;
}

export interface LoginUser {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
    displayName: string;
  };
}

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  loading: boolean;
  fetchLoginUsers: () => Promise<LoginUser[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem('refreshToken')
  );
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  const tryRefresh = useCallback(async (): Promise<boolean> => {
    const storedRefresh = refreshToken || localStorage.getItem('refreshToken');
    if (!storedRefresh) {
      clearAuth();
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
        setRefreshToken(data.data.refreshToken);
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        return true;
      }
      clearAuth();
      return false;
    } catch {
      clearAuth();
      return false;
    }
  }, [refreshToken, clearAuth]);

  useEffect(() => {
    const init = async () => {
      const storedToken = accessToken || localStorage.getItem('accessToken');
      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE}/auth/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.data);
          } else {
            await tryRefresh();
          }
        } catch {
          await tryRefresh();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchLoginUsers = useCallback(async (): Promise<LoginUser[]> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login-users`);
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data.user);
          setAccessToken(data.data.accessToken);
          setRefreshToken(data.data.refreshToken);
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          return { success: true };
        }
        return { success: false, message: data.message || 'Invalid credentials' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Network error' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    clearAuth();
  }, [accessToken, clearAuth]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role.name === 'admin') return true;
      return user.role.permissions.includes(permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (...permissions: string[]): boolean => {
      if (!user) return false;
      if (user.role.name === 'admin') return true;
      return permissions.some((p) => user.role.permissions.includes(p));
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        hasAnyPermission,
        loading,
        fetchLoginUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};