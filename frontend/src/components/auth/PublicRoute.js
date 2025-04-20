import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (token) {
    // If logged in, redirect to appropriate dashboard
    return <Navigate to={userType === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  // If not logged in, render the public component (login/register)
  return children;
};

export default PublicRoute; 