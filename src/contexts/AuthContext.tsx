import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'data_entry' | 'creator' | 'master' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
}

export type Permission = 
  | 'add_customer'
  | 'create_quotation'
  | 'edit_quotation'
  | 'edit_masters'
  | 'approve_otp'
  | 'view_reports'
  | 'edit_image'
  | 'edit_quantity'
  | 'edit_discount';

const rolePermissions: Record<UserRole, Permission[]> = {
  data_entry: ['add_customer', 'create_quotation', 'edit_image', 'edit_quantity'],
  creator: ['add_customer', 'create_quotation', 'edit_quotation', 'edit_image', 'edit_quantity', 'edit_discount'],
  master: ['add_customer', 'create_quotation', 'edit_quotation', 'edit_masters', 'edit_image', 'edit_quantity', 'edit_discount'],
  admin: ['add_customer', 'create_quotation', 'edit_quotation', 'edit_masters', 'approve_otp', 'view_reports', 'edit_image', 'edit_quantity', 'edit_discount'],
};

const mockUsers: Record<string, { password: string; user: User }> = {
  'dataentry@esipl.in': {
    password: 'password123',
    user: { id: '1', name: 'Data Entry User', email: 'dataentry@esipl.in', role: 'data_entry' }
  },
  'creator@esipl.in': {
    password: 'password123',
    user: { id: '2', name: 'Creator User', email: 'creator@esipl.in', role: 'creator' }
  },
  'master@esipl.in': {
    password: 'password123',
    user: { id: '3', name: 'Master User', email: 'master@esipl.in', role: 'master' }
  },
  'admin@esipl.in': {
    password: 'password123',
    user: { id: '4', name: 'Admin User', email: 'admin@esipl.in', role: 'admin' }
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string, role: UserRole): boolean => {
    // Check mock users first
    const mockUser = mockUsers[email];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      return true;
    }
    
    // Allow any email/password combination with selected role
    if (email && password) {
      setUser({
        id: Date.now().toString(),
        name: email.split('@')[0],
        email,
        role,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return rolePermissions[user.role].includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasPermission }}>
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
