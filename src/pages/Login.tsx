import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, LoginUser } from "@/contexts/AuthContext";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Login: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [password, setPassword] = useState("");
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
    else setError(result.message || "Invalid password.");

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* Logo */}
      <div className="sticky top-0 z-50 flex justify-center py-5 bg-white">
        <img src="/logo.png" alt="Ecstatics" className="h-24 object-contain" />
      </div>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">

        {/* Login Section */}
        <div className="flex flex-col bg-white justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">

            {/* Input Area */}
            <div
              className="flex-1 flex flex-col justify-center px-8 space-y-2 mx-4 mb-2"
              style={{ background: "#e06b0a" }}
            >

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={usersLoading}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3",
                    "border border-gray-200 bg-white text-left transition-colors",
                    isDropdownOpen && "border-[#e06b0a]",
                    usersLoading && "opacity-60 cursor-wait"
                  )}
                >
                  {usersLoading ? (
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : selectedUser ? (
                    <span className="text-sm text-gray-800 font-medium">
                      {selectedUser.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Select User</span>
                  )}

                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform duration-200",
                      isDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {isDropdownOpen && !usersLoading && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsDropdownOpen(false)}
                    />

                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-gray-200 shadow-lg max-h-[200px] overflow-y-auto">
                      {users.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                          No users available
                        </div>
                      ) : (
                        users.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleUserSelect(u)}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors",
                              selectedUserId === u.id &&
                                "bg-gray-100 font-medium"
                            )}
                          >
                            {u.name}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Password */}
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="w-full px-4 py-3 border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#e06b0a] transition-colors"
              />

              {error && (
                <p className="text-red-500 text-sm bg-white p-1">{error}</p>
              )}
            </div>

            {/* Login Button */}
            <div className="flex-1 px-4 pb-0 flex">
              <button
                type="submit"
                disabled={isLoading || !selectedUser}
                className="w-full h-full text-white text-2xl font-bold disabled:opacity-90 hover:opacity-90 transition-all cursor-pointer"
                style={{ background: "#e06b0a" }}
              >
                {isLoading ? "Login in..." : "Login"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel */}
        <div
          className="hidden lg:block"
          style={{ background: "#e06b0a" }}
        />
      </div>

      {/* Footer */}
      <div className="py-3 text-center bg-white text-xs text-gray-600">
        © {new Date().getFullYear()} Ecstatics Spaces India Pvt. Ltd. | 
        Design and Develop By{" "}
        <a
          href="https://sugamsofttech.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#e06b0a] font-medium hover:underline ml-1"
        >
          Sugam Softtech
        </a>
      </div>
    </div>
  );
};

export default Login;