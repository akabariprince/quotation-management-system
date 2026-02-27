import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "./AdminLayout";
import { Loader2 } from "lucide-react";

const MainLayout: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <AdminLayout />;
};

export default MainLayout;