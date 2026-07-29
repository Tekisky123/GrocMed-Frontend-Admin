import React, { createContext, useContext, useState, useEffect } from "react";
import { adminApi } from "@/api/adminApi";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (reason?: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    const token = localStorage.getItem("grocmed_token");
    const loginTime = localStorage.getItem("auth_login_time");

    const checkSession = () => {
      if (loginTime) {
        const sixtyDays = 60 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const expirationTime = parseInt(loginTime) + sixtyDays;

        if (now > expirationTime) {
          logout("Session expired. Please login again.");
          return false;
        }
      }
      return true;
    };

    if (storedUser && token) {
      if (checkSession()) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse stored user:", error);
          logout();
        }
      }
    }
    setIsLoading(false);

    // Periodic check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await adminApi.loginAdmin({ email, password });

      if (response.success) {
        const { admin, token } = response.data;
        const mappedUser: User = {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isActive: admin.isActive,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.email}`,
        };

        setUser(mappedUser);
        localStorage.setItem("grocmed_token", token);
        localStorage.setItem("auth_user", JSON.stringify(mappedUser));
        localStorage.setItem("auth_login_time", Date.now().toString());
        toast.success(response.message || "Login successful");
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Login failed";
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (reason?: string) => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("grocmed_token");
    localStorage.removeItem("auth_login_time");
    if (reason) {
      toast.error(reason);
    } else {
      toast.info("Logged out successfully");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
