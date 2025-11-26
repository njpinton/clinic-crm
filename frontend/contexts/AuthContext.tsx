'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { setLogoutCallback } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to refresh token
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const apiUrl = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      : 'http://localhost:8000';

    const response = await fetch(`${apiUrl}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.access || null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);

  // Load auth state from localStorage on mount and register logout callback
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setRefreshTokenValue(storedRefreshToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);

    // Register logout callback for automatic token timeout detection
    setLogoutCallback(logout);
  }, [logout]);

  // Set up token refresh interval (refresh 5 minutes before expiration - assuming 1 hour token life)
  useEffect(() => {
    if (!refreshTokenValue) return;

    const refreshInterval = setInterval(async () => {
      const newToken = await refreshAccessToken(refreshTokenValue);
      if (newToken) {
        setAccessToken(newToken);
        localStorage.setItem('accessToken', newToken);
      } else {
        // If refresh fails, logout user
        logout();
      }
    }, 55 * 60 * 1000); // Refresh every 55 minutes

    return () => clearInterval(refreshInterval);
  }, [refreshTokenValue]);

  const login = async (email: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();

      // Store tokens
      setAccessToken(data.access);
      setRefreshTokenValue(data.refresh);
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // For now, set minimal user data from email
      // TODO: Add /api/auth/me/ endpoint to fetch full user profile
      const userData = {
        id: 'temp-id',
        email: email,
        first_name: 'User',
        last_name: '',
        role: 'admin',
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      router.push('/patients');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshTokenValue(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const refreshToken = async () => {
    if (!refreshTokenValue) {
      logout();
      return;
    }

    const newToken = await refreshAccessToken(refreshTokenValue);
    if (newToken) {
      setAccessToken(newToken);
      localStorage.setItem('accessToken', newToken);
    } else {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
