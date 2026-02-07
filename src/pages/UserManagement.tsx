import React, { useState } from 'react';
import { Plus, Edit, Trash2, Shield, ShieldCheck, ShieldAlert, ShieldOff, Eye } from 'lucide-react';
import { useAuth, UserRole, Permission } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: Date;
  lastLogin?: Date;
}

// Mock users data
const initialUsers: SystemUser[] = [
  { id: '1', name: 'Data Entry User', email: 'dataentry@esipl.in', role: 'data_entry', status: 'active', createdAt: new Date('2025-01-01'), lastLogin: new Date('2025-02-07') },
  { id: '2', name: 'Creator User', email: 'creator@esipl.in', role: 'creator', status: 'active', createdAt: new Date('2025-01-01'), lastLogin: new Date('2025-02-06') },
  { id: '3', name: 'Master User', email: 'master@esipl.in', role: 'master', status: 'active', createdAt: new Date('2025-01-01'), lastLogin: new Date('2025-02-05') },
  { id: '4', name: 'Admin User', email: 'admin@esipl.in', role: 'admin', status: 'active', createdAt: new Date('2025-01-01'), lastLogin: new Date('2025-02-07') },
  { id: '5', name: 'Inactive User', email: 'inactive@esipl.in', role: 'data_entry', status: 'inactive', createdAt: new Date('2025-01-15') },
];

// Role permissions matrix
const rolePermissions: Record<UserRole, Permission[]> = {
  data_entry: ['add_customer', 'create_quotation', 'edit_image', 'edit_quantity'],
  creator: ['add_customer', 'create_quotation', 'edit_quotation', 'edit_image', 'edit_quantity', 'edit_discount'],
  master: ['add_customer', 'create_quotation', 'edit_quotation', 'edit_masters', 'edit_image', 'edit_quantity', 'edit_discount'],
  admin: ['add_customer', 'create_quotation', 'edit_quotation', 'edit_masters', 'approve_otp', 'view_reports', 'edit_image', 'edit_quantity', 'edit_discount'],
};

const permissionLabels: Record<Permission, string> = {
  add_customer: 'Add Customer',
  create_quotation: 'Create Quotation',
  edit_quotation: 'Edit Quotation',
  edit_masters: 'Edit Masters',
  approve_otp: 'Approve OTP',
  view_reports: 'View Reports',
  edit_image: 'Edit Image',
  edit_quantity: 'Edit Quantity',
  edit_discount: 'Edit Discount',
};

const allPermissions: Permission[] = Object.keys(permissionLabels) as Permission[];
const allRoles: UserRole[] = ['data_entry', 'creator', 'master', 'admin'];

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [activeTab, setActiveTab] = useState('users');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'data_entry' as UserRole,
    status: 'active' as 'active' | 'inactive',
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="h-4 w-4 text-accent" />;
      case 'master': return <ShieldAlert className="h-4 w-4 text-warning" />;
      case 'creator': return <Shield className="h-4 w-4 text-primary" />;
      default: return <ShieldOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleOpenModal = (userToEdit?: SystemUser) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        status: userToEdit.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'data_entry',
        status: 'active',
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingUser) {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...formData }
          : u
      ));
      toast.success('User updated successfully');
    } else {
      const newUser: SystemUser = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
      };
      setUsers(prev => [...prev, newUser]);
      toast.success('User created successfully');
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === user?.id) {
      toast.error('Cannot delete your own account');
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
    toast.success('User status updated');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button className="btn-accent gap-2" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add User</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="users">User List</TabsTrigger>
            <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="enterprise-card p-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Users Table */}
          <div className="enterprise-card overflow-hidden">
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th className="hidden sm:table-cell">Email</th>
                    <th>Role</th>
                    <th className="hidden md:table-cell">Status</th>
                    <th className="hidden lg:table-cell">Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted-foreground py-12">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                              <span className="text-accent font-semibold text-sm">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell text-muted-foreground">{u.email}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(u.role)}
                            <span className="capitalize text-sm">{u.role.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className={u.status === 'active' ? 'badge-success' : 'badge-error'}>
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell text-muted-foreground">
                          {formatDate(u.lastLogin)}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenModal(u)}
                              className="action-btn"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className="action-btn"
                              title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {u.status === 'active' ? (
                                <ShieldOff className="h-4 w-4 text-warning" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-success" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="action-btn action-btn-danger"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {/* Permission Matrix */}
          <div className="enterprise-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Role Permission Matrix</h3>
              <p className="text-sm text-muted-foreground mt-1">Read-only view of permissions assigned to each role</p>
            </div>
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    {allRoles.map(role => (
                      <th key={role} className="text-center capitalize">
                        {role.replace('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPermissions.map(permission => (
                    <tr key={permission}>
                      <td className="font-medium">{permissionLabels[permission]}</td>
                      {allRoles.map(role => (
                        <td key={role} className="text-center">
                          {rolePermissions[role].includes(permission) ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-success/10 rounded-full">
                              <ShieldCheck className="h-4 w-4 text-success" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-muted rounded-full">
                              <ShieldOff className="h-4 w-4 text-muted-foreground" />
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter user name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_entry">Data Entry</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
            <Button className="btn-accent" onClick={handleSaveUser}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
