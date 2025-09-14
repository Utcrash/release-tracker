import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  role: string | null;
  setRole: (role: string | null) => void;
  logout: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch('/release-tracker/api/auth/me', { credentials: 'include' })
    //   .then(res => res.ok ? res.json() : Promise.reject())
    //   .then(data => {
    //     setRole(data.role);
    //     setLoading(false);
    //   })
    //   .catch(() => {
    //     setRole(null);
    //     setLoading(false);
    //   });
    // Set default role for testing without auth
    setRole('editor');
    setLoading(false);
  }, []);

  const logout = () => {
    setRole(null);
  };

  return (
    <UserContext.Provider value={{ role, setRole, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 