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
    <div className="flex flex-col h-dvh bg-white">
      {/* ─── Logo ─── */}
      <div className="sticky top-0 z-50 flex justify-start py-3 sm:py-4 lg:py-5 bg-white ml-5">
        <img
          src="/logo.png"
          alt="Ecstatics"
          className="h-14 sm:h-14 md:h-14 lg:h-14 object-contain"
        />
      </div>

      {/* ─── Main Layout ───
           mx  = left & right outer spacing
           gap = white space BETWEEN columns (form ↔ orange panel)
      */}
      <div
        className={cn(
          "flex-1 grid min-h-0",
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-12",
          "gap-2",
          "mx-4 sm:mx-5"
        )}
      >
        {/* ─── Login Form Column ─── */}
        <div className="flex flex-col col-span-1 md:col-span-1 lg:col-span-3 bg-white justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col h-full gap-2">

            {/* ═══ TOP: Orange Input Area ═══ */}
            <div
              className={cn(
                "flex-1 flex flex-col justify-center",
                "px-5 sm:px-6 md:px-7 lg:px-8",
                "py-6 sm:py-8",
                "space-y-2"
              )}
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
                    <><div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800 font-medium">
                        {selectedUser.name}
                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
                        {selectedUser.role?.displayName}
                      </span>
                    </div></>
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
                            <div className="flex items-center justify-between">
                              <span>{u.name}</span>

                              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
                                {u.role?.displayName}
                              </span>
                            </div>
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
                <p className="text-red-500 text-xs sm:text-sm bg-white p-1">
                  {error}
                </p>
              )}
            </div>

            {/* ═══ gap-2 on form creates WHITE STRIPE here ═══ */}

            {/* ═══ BOTTOM: Login Button ═══ */}
            <div className="flex-1 flex">
              <button
                type="submit"
                disabled={isLoading || !selectedUser}
                className={cn(
                  "w-full h-full text-white font-bold",
                  "text-lg sm:text-xl lg:text-2xl",
                  "min-h-[60px] sm:min-h-[70px]",
                  "disabled:opacity-90 hover:opacity-90 transition-all cursor-pointer"
                )}
                style={{ background: "#e06b0a" }}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Right Orange Panel ─── */}
        <div
          className="hidden md:block md:col-span-1 lg:col-span-9"
          style={{ background: "#e06b0a" }}
        />
      </div>

      {/* ─── Footer ─── */}
      <div className="py-2 sm:py-3 text-center bg-white text-[10px] sm:text-xs text-gray-600 px-4">
        © {new Date().getFullYear()} Ecstatics Spaces India Pvt. Ltd. | Design
        and Develop By{" "}
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
