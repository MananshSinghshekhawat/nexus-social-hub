import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import api from "@/lib/api";

export interface User {
  _id: string;
  id?: string; // for compatibility
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio?: string;
  website?: string;
  role?: string; // Added role
  cover_url?: string; // Added cover_url
  followers_count?: number;
  following_count?: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // Added token
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token')); // Added token state
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        setToken(savedToken);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setUser(userData);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error("Failed to refresh profile", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
