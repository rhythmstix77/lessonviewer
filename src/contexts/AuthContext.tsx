import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { wordpressAPI } from '../config/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('rhythmstix_auth_token');
      if (token) {
        if (token === 'rhythmstix_admin_token') {
          // Admin user
          const userData: User = {
            id: '1',
            email: 'rob.reichstorer@gmail.com',
            name: 'Rob Reichstorer',
            avatar: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
            role: 'administrator'
          };
          setUser(userData);
        } else {
          // Try WordPress validation if configured
          const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL;
          if (wordpressUrl && wordpressUrl !== 'https://your-wordpress-site.com') {
            try {
              const isValid = await wordpressAPI.validateToken(token);
              if (isValid) {
                const userInfo = await wordpressAPI.getUserInfo(token);
                const userData: User = {
                  id: userInfo.id.toString(),
                  email: userInfo.email,
                  name: userInfo.name,
                  avatar: userInfo.avatar_urls?.['96'] || userInfo.avatar_urls?.['48'],
                  role: userInfo.roles?.[0] || 'subscriber',
                  token
                };
                setUser(userData);
              } else {
                localStorage.removeItem('rhythmstix_auth_token');
              }
            } catch (error) {
              console.warn('WordPress token validation failed:', error);
              localStorage.removeItem('rhythmstix_auth_token');
            }
          } else {
            localStorage.removeItem('rhythmstix_auth_token');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('rhythmstix_auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // Check for the specific admin credentials
      if (username === 'rob.reichstorer@gmail.com' && password === 'mubqaZ-piske5-xecdur') {
        const userData: User = {
          id: '1',
          email: 'rob.reichstorer@gmail.com',
          name: 'Rob Reichstorer',
          avatar: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          role: 'administrator'
        };
        
        localStorage.setItem('rhythmstix_auth_token', 'rhythmstix_admin_token');
        setUser(userData);
        return;
      }
      
      // Check if WordPress is configured for other users
      const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL;
      
      if (wordpressUrl && wordpressUrl !== 'https://your-wordpress-site.com') {
        // Try WordPress authentication
        try {
          const authResponse = await wordpressAPI.authenticate(username, password);
          
          if (authResponse.token) {
            localStorage.setItem('rhythmstix_auth_token', authResponse.token);
            const userInfo = await wordpressAPI.getUserInfo(authResponse.token);
            
            const userData: User = {
              id: userInfo.id.toString(),
              email: userInfo.email,
              name: userInfo.name,
              avatar: userInfo.avatar_urls?.['96'] || userInfo.avatar_urls?.['48'],
              role: userInfo.roles?.[0] || 'subscriber',
              token: authResponse.token
            };
            
            setUser(userData);
            return;
          } else {
            throw new Error('No token received from WordPress');
          }
        } catch (wpError) {
          console.warn('WordPress authentication failed:', wpError);
          throw new Error('Invalid credentials. Please check your email and password.');
        }
      } else {
        // No WordPress configured and not the admin user
        throw new Error('Invalid credentials. Please check your email and password.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rhythmstix_auth_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };