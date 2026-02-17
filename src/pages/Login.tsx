import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, LoginUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Shield,
  Sparkles,
  BarChart3,
  FolderKanban,
  Lock,
  ChevronDown,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getRoleColor = (roleName: string): string => {
  const colors: Record<string, string> = {
    admin: "bg-primary",
    master: "bg-accent",
    creator: "bg-secondary text-primary",
    data_entry: "bg-primary/70",
    viewer: "bg-muted text-primary",
  };
  return colors[roleName] || "bg-primary";
};

const getRoleBadgeStyle = (roleName: string): string => {
  const styles: Record<string, string> = {
    admin: "bg-primary/10 text-primary border-primary/20",
    master: "bg-accent/15 text-accent border-accent/20",
    creator: "bg-secondary/50 text-primary border-secondary/60",
    data_entry: "bg-primary/10 text-primary border-primary/15",
    viewer: "bg-muted text-muted-foreground border-border",
  };
  return styles[roleName] || "bg-muted text-muted-foreground border-border";
};

const Login: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<LoginUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { login, isAuthenticated, fetchLoginUsers } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadUsers = async () => {
      setUsersLoading(true);
      const fetchedUsers = await fetchLoginUsers();
      setUsers(fetchedUsers);
      setUsersLoading(false);
    };
    loadUsers();
  }, [fetchLoginUsers]);

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  // Group users by role for the dropdown
  const groupedUsers = users.reduce<Record<string, LoginUser[]>>((acc, user) => {
    const roleDisplay = user.role.displayName;
    if (!acc[roleDisplay]) acc[roleDisplay] = [];
    acc[roleDisplay].push(user);
    return acc;
  }, {});

  const handleUserSelect = (user: LoginUser) => {
    setSelectedUserId(user.id);
    setError("");
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedUser) {
      setError("Please select a user");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    const result = await login(selectedUser.email, password);
    if (result.success) navigate("/dashboard");
    else setError(result.message || "Invalid password. Please try again.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ═══ LEFT PANEL ═══ */}
      <div className="w-full lg:w-[440px] xl:w-[480px] flex flex-col bg-card border-r-2 border-primary/15 relative z-10 flex-shrink-0">
        {/* Logo */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl">
                E
              </span>
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg leading-tight">
                ecstatics.
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Quotation Management System
              </p>
            </div>
          </div>
        </div>

        <div className="px-6">
          <div className="h-0.5 bg-primary/10" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">
              Select your account and enter password to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Select Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Select User</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={usersLoading}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl",
                    "border-2 border-primary/15 bg-background",
                    "hover:border-accent/40 transition-all duration-200",
                    "text-left focus:outline-none focus:border-accent",
                    isDropdownOpen && "border-accent shadow-sm",
                    usersLoading && "opacity-60 cursor-wait"
                  )}
                >
                  {usersLoading ? (
                    <div className="flex items-center gap-3 w-full">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Loading users...
                      </span>
                    </div>
                  ) : selectedUser ? (
                    <>
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          "text-white text-sm font-bold flex-shrink-0",
                          getRoleColor(selectedUser.role.name)
                        )}
                      >
                        {getInitials(selectedUser.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {selectedUser.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedUser.email}
                          </p>
                          <span
                            className={cn(
                              "inline-block text-[10px] px-2 py-0.5 rounded-full",
                              "border font-semibold flex-shrink-0",
                              getRoleBadgeStyle(selectedUser.role.name)
                            )}
                          >
                            {selectedUser.role.displayName}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Choose your account...
                      </span>
                    </div>
                  )}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground flex-shrink-0 ml-auto transition-transform duration-200",
                      isDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Dropdown List */}
                {isDropdownOpen && !usersLoading && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsDropdownOpen(false)}
                    />

                    <div
                      className={cn(
                        "absolute top-full left-0 right-0 mt-2 z-30",
                        "bg-card border-2 border-primary/15 rounded-xl shadow-xl",
                        "max-h-[320px] overflow-y-auto",
                        "animate-in fade-in-0 zoom-in-95 duration-150"
                      )}
                    >
                      {Object.keys(groupedUsers).length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            No users available
                          </p>
                        </div>
                      ) : (
                        <div className="py-2">
                          {Object.entries(groupedUsers).map(
                            ([roleDisplay, roleUsers], groupIndex) => (
                              <div key={roleDisplay}>
                                {groupIndex > 0 && (
                                  <div className="mx-3 my-1 h-px bg-border" />
                                )}
                                {/* Role Group Header */}
                                <div className="flex items-center gap-2 px-4 pt-2.5 pb-1.5">
                                  <Shield className="h-3 w-3 text-accent" />
                                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {roleDisplay}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/50">
                                    ({roleUsers.length})
                                  </span>
                                </div>

                                {/* Users in Group */}
                                {roleUsers.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => handleUserSelect(u)}
                                    className={cn(
                                      "w-full flex items-center gap-3 px-4 py-2.5",
                                      "hover:bg-accent/5 transition-colors text-left",
                                      selectedUserId === u.id &&
                                        "bg-accent/10 border-l-2 border-l-accent"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center",
                                        "text-white text-xs font-bold flex-shrink-0",
                                        getRoleColor(u.role.name)
                                      )}
                                    >
                                      {getInitials(u.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-foreground text-sm truncate">
                                        {u.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {u.email}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  className="pl-10 pr-10 h-12 text-sm border-2 border-primary/15 focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-sm font-bold btn-accent"
              disabled={isLoading || !selectedUser}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
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

        <div className="px-6 py-4 border-t-2 border-primary/10 flex-shrink-0">
          <p className="text-[11px] text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Ecstatics Spaces India Pvt. Ltd.
          </p>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Brand ═══ */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: "#562F00" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full -translate-y-1/4 translate-x-1/4"
          style={{ background: "rgba(255,206,153,0.08)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full translate-y-1/3 -translate-x-1/4"
          style={{ background: "rgba(255,150,68,0.06)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
          style={{ background: "rgba(255,253,241,0.03)" }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,253,241,0.8) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 xl:px-20 text-center">
          <div className="mb-12 max-w-lg">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 border"
              style={{
                background: "rgba(255,206,153,0.15)",
                borderColor: "rgba(255,206,153,0.2)",
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: "#FFCE99" }} />
              <span
                className="text-sm font-medium"
                style={{ color: "#FFCE99" }}
              >
                Premium Management Suite
              </span>
            </div>

            <h1
              className="text-5xl xl:text-6xl font-bold mb-5 tracking-tight leading-[1.1]"
              style={{ color: "#FFFDF1" }}
            >
              Interior &<br />
              Furniture
              <br />
              <span style={{ color: "rgba(255,253,241,0.5)" }}>
                Management
              </span>
            </h1>

            <p
              className="text-lg leading-relaxed max-w-md mx-auto"
              style={{ color: "rgba(255,253,241,0.45)" }}
            >
              Streamline your projects, quotations, and customer relationships
              with our comprehensive platform.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-4 max-w-lg w-full">
            {[
              {
                icon: Shield,
                title: "Secure Access",
                desc: "Role-based permissions",
              },
              {
                icon: FolderKanban,
                title: "Projects",
                desc: "End-to-end management",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                desc: "Business insights",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl p-4 border text-left group hover:border-opacity-20 transition-colors"
                style={{
                  background: "rgba(255,150,68,0.08)",
                  borderColor: "rgba(255,150,68,0.12)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
                  style={{ background: "rgba(255,206,153,0.15)" }}
                >
                  <feature.icon
                    className="h-4 w-4"
                    style={{ color: "#FFCE99" }}
                  />
                </div>
                <p
                  className="text-sm font-medium mb-0.5"
                  style={{ color: "rgba(255,253,241,0.85)" }}
                >
                  {feature.title}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,253,241,0.35)" }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-8 py-5 flex items-center justify-between">
          <p
            className="text-xs"
            style={{ color: "rgba(255,253,241,0.2)" }}
          >
            Ecstatics Spaces India Pvt. Ltd.
          </p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    i === 1
                      ? "rgba(255,206,153,0.5)"
                      : "rgba(255,206,153,0.2)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;