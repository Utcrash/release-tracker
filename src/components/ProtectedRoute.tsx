import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { role } = useUser();
  // if (role === null) {
  //   return <Navigate to="/login" replace />;
  // }
  return <>{children}</>;
};

export default ProtectedRoute; 