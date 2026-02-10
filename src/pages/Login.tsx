import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';

const userList = [
  { id: '1', name: 'Data Entry User', email: 'dataentry@esipl.in', role: 'data_entry' as UserRole },
  { id: '2', name: 'Creator User', email: 'creator@esipl.in', role: 'creator' as UserRole },
  { id: '3', name: 'Master User', email: 'master@esipl.in', role: 'master' as UserRole },
  { id: '4', name: 'Admin User', email: 'admin@esipl.in', role: 'admin' as UserRole },
];

const Login: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const selectedUser = userList.find(u => u.id === selectedUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedUser) { setError('Please select a user'); return; }
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(selectedUser.email, password, selectedUser.role);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex overflow-y-auto">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/20" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mb-6">
              <span className="text-3xl font-bold">E</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">ecstatics.</h1>
            <p className="text-xl text-primary-foreground/80">
              Premium Interior & Furniture Solutions
            </p>
          </div>
          <div className="space-y-4 text-primary-foreground/70">
            <p className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Custom Quotation Management
            </p>
            <p className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Role-Based Access Control
            </p>
            <p className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Professional PDF Generation
            </p>
            <p className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Comprehensive MIS Reports
            </p>
          </div>
        </div>
        <div className="absolute bottom-8 left-16 text-primary-foreground/50 text-sm">
          Ecstatics Spaces India Pvt. Ltd.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-xl">E</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">ecstatics.</h1>
          </div>

          <div className="enterprise-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground">Welcome Back</h2>
              <p className="text-muted-foreground mt-2">Select your account to sign in</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="user">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="select-field">
                    <SelectValue placeholder="Choose your account" />
                  </SelectTrigger>
                  <SelectContent>
                    {userList.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className="text-muted-foreground text-xs capitalize">({u.role.replace('_', ' ')})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full btn-accent"
                disabled={isLoading || !selectedUserId}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            © 2025 Ecstatics Spaces India Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
