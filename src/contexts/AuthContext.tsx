
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

// Define the user roles
export type UserRole = 'admin' | 'dp_team' | 'qa_team' | 'viewer';

// Define the user type
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

// Mock users for demo purposes
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@medytox.com',
    role: 'admin',
    permissions: ['edit_all', 'view_all', 'confirm_data', 'manage_users']
  },
  {
    id: '2',
    name: 'DP Team Member',
    email: 'dp@medytox.com',
    role: 'dp_team',
    permissions: ['edit_data', 'view_all', 'confirm_data']
  },
  {
    id: '3',
    name: 'QA Team Member',
    email: 'qa@medytox.com',
    role: 'qa_team',
    permissions: ['view_all', 'confirm_data']
  },
  {
    id: '4',
    name: 'Viewer',
    email: 'viewer@medytox.com',
    role: 'viewer',
    permissions: ['view_all']
  }
];

// Define the Auth context type
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

// Create the Auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('medytoxUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, you would validate with a backend
    // For demo, we'll check against mock users
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('medytoxUser', JSON.stringify(foundUser));
      toast.success(`Welcome back, ${foundUser.name}`);
      return true;
    }
    
    toast.error('Invalid credentials');
    return false;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('medytoxUser');
    toast.info('You have been logged out');
  };

  // Check if the user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
